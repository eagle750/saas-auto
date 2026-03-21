import type { ReviewCodeInput, ReviewResult, CodeFix } from "@/types/ai";
import { claudeClient } from "./clients/claude";
import { REVIEW_SYSTEM_PROMPT } from "./prompts/review";

const MAX_FILES_PER_BATCH = 20;
const MAX_OUTPUT_TOKENS = 8192;

/**
 * Parse Claude's JSON review response into a ReviewResult.
 * Handles accidental markdown fences and malformed output gracefully.
 */
function parseReviewResult(jsonString: string): ReviewResult {
  const cleaned = jsonString
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If the response is not valid JSON, return a safe fallback with the raw content
    return {
      fixes: [],
      summary: `Review completed but response could not be parsed as JSON. Raw response:\n${cleaned.slice(0, 1000)}`,
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      fixes: [],
      summary: "Review response was not a JSON object.",
    };
  }

  const result = parsed as Record<string, unknown>;

  // Parse fixes array
  const fixes: CodeFix[] = [];
  if (Array.isArray(result.fixes)) {
    for (const fix of result.fixes) {
      if (typeof fix !== "object" || fix === null) continue;
      const f = fix as Record<string, unknown>;

      if (
        typeof f.file === "string" &&
        typeof f.issue === "string" &&
        typeof f.fixedCode === "string"
      ) {
        fixes.push({
          file: f.file,
          issue: f.issue,
          fixedCode: f.fixedCode,
        });
      }
    }
  }

  const summary =
    typeof result.summary === "string"
      ? result.summary
      : `Review completed. ${fixes.length} fix(es) found.`;

  return { fixes, summary };
}

/**
 * Serialize a batch of files into the JSON structure that the review prompt expects.
 */
function buildReviewPayload(
  batch: Map<string, string>,
  input: ReviewCodeInput,
): string {
  const filesRecord: Record<string, string> = {};
  for (const [path, content] of batch) {
    filesRecord[path] = content;
  }

  return JSON.stringify(
    {
      files: filesRecord,
      architecturePlan: input.architecturePlan,
      config: input.config,
    },
    null,
    2,
  );
}

/**
 * Merge multiple ReviewResults from batched reviews into a single ReviewResult.
 */
function mergeReviewResults(results: ReviewResult[]): ReviewResult {
  if (results.length === 0) {
    return { fixes: [], summary: "No files reviewed." };
  }
  if (results.length === 1) {
    return results[0];
  }

  const allFixes: CodeFix[] = [];
  const summaries: string[] = [];

  for (const result of results) {
    allFixes.push(...result.fixes);
    summaries.push(result.summary);
  }

  return {
    fixes: allFixes,
    summary: summaries
      .map((s, i) => `Batch ${i + 1}: ${s}`)
      .join("\n\n"),
  };
}

/**
 * Review a single batch of files using Claude.
 */
async function reviewBatch(
  batch: Map<string, string>,
  input: ReviewCodeInput,
): Promise<ReviewResult> {
  const payload = buildReviewPayload(batch, input);

  const userMessage = `Please review the following generated Next.js application files and return a JSON object with any fixes needed.

${payload}`;

  const response = await claudeClient.generate(
    [{ role: "user", content: userMessage }],
    {
      systemPrompt: REVIEW_SYSTEM_PROMPT,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.1, // Very low temperature for consistent, objective review
    },
  );

  return parseReviewResult(response.content);
}

/**
 * Review all generated files using Claude and return a ReviewResult with fixes.
 *
 * For projects with more than MAX_FILES_PER_BATCH files, the review is performed
 * in batches and results are merged. Each batch includes the full architecture
 * plan and config for context.
 *
 * @param input - The review input with all generated files, plan, and config.
 * @returns ReviewResult containing all identified fixes and a summary.
 */
export async function reviewCode(input: ReviewCodeInput): Promise<ReviewResult> {
  const { files } = input;

  if (files.size === 0) {
    return { fixes: [], summary: "No files provided for review." };
  }

  // Split files into batches
  const batches: Map<string, string>[] = [];
  let currentBatch = new Map<string, string>();

  for (const [path, content] of files) {
    currentBatch.set(path, content);

    if (currentBatch.size >= MAX_FILES_PER_BATCH) {
      batches.push(currentBatch);
      currentBatch = new Map<string, string>();
    }
  }

  if (currentBatch.size > 0) {
    batches.push(currentBatch);
  }

  if (batches.length === 1) {
    // Single batch — straightforward review
    return reviewBatch(batches[0], input);
  }

  // Multiple batches — review in parallel and merge
  const batchResults = await Promise.all(
    batches.map((batch) => reviewBatch(batch, input)),
  );

  return mergeReviewResults(batchResults);
}
