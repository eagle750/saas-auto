import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Content,
} from "@google/generative-ai";
import type { AIMessage, AIRequestOptions, AIResponse } from "@/types/ai";

const DEFAULT_MODEL = "gemini-2.0-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("quota exceeded") ||
      msg.includes("resource_exhausted")
    );
  }
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

function convertToGeminiHistory(
  messages: AIMessage[],
  systemPrompt?: string,
): { history: Content[]; lastUserMessage: string } {
  const conversationMessages = messages.filter((m) => m.role !== "system");

  if (conversationMessages.length === 0) {
    throw new Error("At least one user message is required");
  }

  const lastMessage = conversationMessages[conversationMessages.length - 1];
  if (lastMessage.role !== "user") {
    throw new Error("The last message must be a user message");
  }

  let lastUserMessage = lastMessage.content;

  // Prepend system prompt to the first user message in history
  const history: Content[] = [];
  const priorMessages = conversationMessages.slice(0, -1);

  for (let i = 0; i < priorMessages.length; i++) {
    const msg = priorMessages[i];
    let content = msg.content;

    // Prepend system prompt to the first user message
    if (i === 0 && msg.role === "user" && systemPrompt) {
      content = `${systemPrompt}\n\n${content}`;
    }

    history.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: content }],
    });
  }

  // If no prior messages but we have a system prompt, prepend to last user message
  if (history.length === 0 && systemPrompt) {
    lastUserMessage = `${systemPrompt}\n\n${lastUserMessage}`;
  }

  return { history, lastUserMessage };
}

export const geminiClient = {
  async generate(
    messages: AIMessage[],
    options: AIRequestOptions = {},
  ): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
    );

    const modelName = options.model ?? DEFAULT_MODEL;
    const maxOutputTokens = options.maxTokens ?? 8192;
    const temperature = options.temperature ?? 0.7;

    const systemMessages = messages.filter((m) => m.role === "system");
    const systemPrompt =
      options.systemPrompt ??
      (systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join("\n\n")
        : undefined);

    const { history, lastUserMessage } = convertToGeminiHistory(
      messages,
      systemPrompt,
    );

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      generationConfig: {
        maxOutputTokens,
        temperature,
      },
    });

    const response = await withExponentialBackoff(async () => {
      const chat = model.startChat({ history });
      return chat.sendMessage(lastUserMessage);
    });

    const result = response.response;
    const content = result.text();
    const usageMetadata = result.usageMetadata;

    return {
      content,
      model: modelName,
      usage: usageMetadata
        ? {
            inputTokens: usageMetadata.promptTokenCount ?? 0,
            outputTokens: usageMetadata.candidatesTokenCount ?? 0,
          }
        : undefined,
    };
  },
};
