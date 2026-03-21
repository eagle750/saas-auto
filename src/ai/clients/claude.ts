import Anthropic from "@anthropic-ai/sdk";
import type { AIMessage, AIRequestOptions, AIResponse } from "@/types/ai";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Anthropic.RateLimitError) return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 429
  )
    return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.random() * 500;
      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

export const claudeClient = {
  async generate(
    messages: AIMessage[],
    options: AIRequestOptions = {},
  ): Promise<AIResponse> {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const model = options.model ?? DEFAULT_MODEL;
    const maxTokens = options.maxTokens ?? 8192;
    const temperature = options.temperature ?? 0.7;

    // Separate system messages from conversation messages
    const systemMessages = messages.filter((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    // Build system prompt: prefer options.systemPrompt, then collected system messages
    const systemContent =
      options.systemPrompt ??
      (systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join("\n\n")
        : undefined);

    // Anthropic SDK requires alternating user/assistant roles; collapse consecutive same-role messages
    const normalizedMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const msg of conversationMessages) {
      if (msg.role === "user" || msg.role === "assistant") {
        const last = normalizedMessages[normalizedMessages.length - 1];
        if (last && last.role === msg.role) {
          last.content += "\n\n" + msg.content;
        } else {
          normalizedMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Ensure we have at least one user message
    if (normalizedMessages.length === 0) {
      throw new Error("At least one user message is required");
    }

    const response = await withExponentialBackoff(() =>
      client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(systemContent ? { system: systemContent } : {}),
        messages: normalizedMessages,
      }),
    );

    const content = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    return {
      content,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  },
};
