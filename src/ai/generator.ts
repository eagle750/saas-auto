import type { GenerateFileInput } from "@/types/ai";
import type { GenerationConfig } from "@/types/project";
import { claudeClient } from "./clients/claude";
import { geminiClient } from "./clients/gemini";
import { GENERATION_SYSTEM_PROMPT } from "./prompts/generation";
import { getRelevantContext } from "./utils/fileSplitter";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_CONTEXT_TOKENS = 40_000;
const MAX_OUTPUT_TOKENS = 8192;

/**
 * Remove markdown code fences that the model may have wrapped the output in,
 * despite being instructed not to.
 */
function stripMarkdownFences(content: string): string {
  // Match opening fence: optional whitespace, ```, optional language identifier, newline
  const fenceOpenPattern = /^[ \t]*```[a-zA-Z0-9]*\s*\n/;
  // Match closing fence: optional whitespace, ```, optional trailing whitespace/newline
  const fenceClosePattern = /\n[ \t]*```[ \t]*$/;

  let cleaned = content.trim();

  if (fenceOpenPattern.test(cleaned)) {
    cleaned = cleaned.replace(fenceOpenPattern, "");
  }
  if (fenceClosePattern.test(cleaned)) {
    cleaned = cleaned.replace(fenceClosePattern, "");
  }

  return cleaned.trimStart();
}

/**
 * Build a descriptive summary of the architecture plan for context injection.
 */
function buildPlanSummary(
  plan: GenerateFileInput["architecturePlan"],
  config: GenerationConfig,
): string {
  const configLines = Object.entries(config)
    .filter(([, v]) => v !== undefined && v !== "none")
    .map(([k, v]) => `  - ${k}: ${String(v)}`)
    .join("\n");

  return `## Project: ${plan.projectName}
${plan.description}

## Technology Stack
${configLines || "  - Default Next.js stack"}

## Key Architecture Decisions
${plan.keyDecisions.map((d) => `  - ${d}`).join("\n")}

## API Routes
${plan.apiRoutes.length > 0 ? plan.apiRoutes.map((r) => `  - ${r}`).join("\n") : "  - None"}

## Pages
${plan.pages.map((p) => `  - ${p}`).join("\n")}

## Environment Variables Required
${plan.envVars.map((v) => `  - ${v}`).join("\n") || "  - None"}`;
}

/**
 * Build the user-facing prompt for a single file generation request.
 */
function buildGenerationPrompt(
  input: GenerateFileInput,
  contextFiles: string,
): string {
  const { fileSpec, architecturePlan, config } = input;

  const dependencyList =
    fileSpec.dependencies.length > 0
      ? fileSpec.dependencies.map((d) => `  - ${d}`).join("\n")
      : "  - None";

  const planSummary = buildPlanSummary(architecturePlan, config);

  const contextSection =
    contextFiles.trim().length > 0
      ? `\n## Previously Generated Files (Context)\n${contextFiles}`
      : "";

  return `Generate the complete production-ready TypeScript code for the following file.

## File to Generate
**Path:** ${fileSpec.path}
**Purpose:** ${fileSpec.purpose}
**Complexity:** ${fileSpec.complexity}
**Dependencies (files this imports from):**
${dependencyList}

## Architecture Context
${planSummary}
${contextSection}

## Instructions
- Output ONLY the file content — no markdown fences, no explanations
- The first character of your response must be the first character of the file
- Follow the GENERATION_SYSTEM_PROMPT rules strictly
- Import from the exact dependency paths listed above using @/ alias
- This is a ${input.config.styling ?? "tailwind"} styled project`;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a single file using the specified AI model with retry and fallback logic.
 *
 * Retry strategy:
 * 1. Attempt generation with the preferred model up to MAX_RETRIES times with
 *    exponential backoff.
 * 2. If all retries with the primary model fail, fall back to the other model
 *    for one final attempt.
 *
 * @param input - The file generation input including spec, plan, context, and config.
 * @returns The generated file content as a string (markdown fences stripped).
 */
export async function generateFile(input: GenerateFileInput): Promise<string> {
  const { fileSpec, previousFiles, model } = input;

  // Build context from previously generated files
  const contextFiles = getRelevantContext(
    previousFiles,
    fileSpec.path,
    MAX_CONTEXT_TOKENS,
  );

  const prompt = buildGenerationPrompt(input, contextFiles);

  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    { role: "user", content: prompt },
  ];

  const options = {
    systemPrompt: GENERATION_SYSTEM_PROMPT,
    maxTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.2, // Low temperature for deterministic, correct code
  };

  const primaryClient = model === "claude" ? claudeClient : geminiClient;
  const fallbackClient = model === "claude" ? geminiClient : claudeClient;

  let lastError: unknown;

  // Primary model with retries
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await primaryClient.generate(messages, options);
      return stripMarkdownFences(response.content);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === MAX_RETRIES - 1;
      if (isLastAttempt) break;

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.random() * 500;
      await sleep(delay + jitter);
    }
  }

  // Fallback to the other model
  try {
    const response = await fallbackClient.generate(messages, {
      ...options,
      // The fallback model gets the same context but we note the original model failed
      systemPrompt:
        GENERATION_SYSTEM_PROMPT +
        `\n\n// Note: generating ${fileSpec.path} after primary model failure`,
    });
    return stripMarkdownFences(response.content);
  } catch (fallbackError) {
    // Both models failed — throw the original error with context
    const primaryModelName = model === "claude" ? "Claude" : "Gemini";
    const fallbackModelName = model === "claude" ? "Gemini" : "Claude";

    throw new Error(
      `Failed to generate ${fileSpec.path}:\n` +
        `  ${primaryModelName} (primary, ${MAX_RETRIES} retries): ${String(lastError)}\n` +
        `  ${fallbackModelName} (fallback): ${String(fallbackError)}`,
    );
  }
}

/**
 * Select the preferred AI model for a given file spec.
 * Claude is preferred for complex backend logic; Gemini for UI and boilerplate.
 */
export function selectModel(fileSpec: import("@/types/project").FileSpec): "claude" | "gemini" {
  if (fileSpec.preferredModel) return fileSpec.preferredModel;

  if (
    fileSpec.path.includes("/api/") ||
    fileSpec.path.includes("/ai/") ||
    fileSpec.path.includes("prisma") ||
    fileSpec.path.includes("/lib/") ||
    fileSpec.path.includes("auth") ||
    fileSpec.path.includes("middleware") ||
    fileSpec.complexity === "high"
  ) {
    return "claude";
  }

  return "gemini";
}
