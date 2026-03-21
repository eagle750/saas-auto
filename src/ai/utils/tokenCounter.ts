/**
 * Token estimation utilities.
 *
 * Uses a rough approximation of 1 token ≈ 4 characters, which is consistent
 * with OpenAI's published tokenizer statistics for English prose and code.
 * For precise billing-accurate counts use the respective SDK tokenizers.
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimate the number of tokens in a string.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated token count.
 */
export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate a string to fit within a maximum token budget.
 * Truncation happens at a whitespace boundary when possible to avoid
 * cutting words in the middle.
 *
 * @param text - The text to truncate.
 * @param maxTokens - The maximum number of tokens allowed.
 * @returns The truncated string.
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  if (maxTokens <= 0) return "";

  const maxChars = maxTokens * CHARS_PER_TOKEN;

  if (text.length <= maxChars) return text;

  // Try to cut at a whitespace boundary within the last 20% of the budget
  const hardCut = text.slice(0, maxChars);
  const searchStart = Math.floor(maxChars * 0.8);
  const lastWhitespace = hardCut.lastIndexOf("\n", maxChars);

  if (lastWhitespace > searchStart) {
    return hardCut.slice(0, lastWhitespace);
  }

  const lastSpace = hardCut.lastIndexOf(" ", maxChars);
  if (lastSpace > searchStart) {
    return hardCut.slice(0, lastSpace);
  }

  return hardCut;
}

interface FileEntry {
  path: string;
  content: string;
  tokens: number;
}

/**
 * Build a summarized context string from a map of files, fitting within maxTokens.
 *
 * Strategy:
 * 1. Sort files by path to prefer including foundational files (types, lib, utils).
 * 2. Always include the smallest files first to maximise the number of files included.
 * 3. For files that don't fully fit, include a truncated version with a notice.
 *
 * @param files - Map of file path → file content.
 * @param maxTokens - Maximum token budget for the returned string.
 * @returns A formatted string containing as many files as possible.
 */
export function summarizeContext(
  files: Map<string, string>,
  maxTokens: number,
): string {
  if (files.size === 0) return "";

  // Priority ordering: types < lib/utils < components < api routes < pages
  const priorityScore = (path: string): number => {
    if (path.includes("types/")) return 0;
    if (path.includes("lib/") || path.includes("utils/")) return 1;
    if (path.includes("components/ui/")) return 2;
    if (path.includes("components/")) return 3;
    if (path.includes("api/")) return 4;
    if (path.includes("app/")) return 5;
    return 3;
  };

  const entries: FileEntry[] = Array.from(files.entries())
    .map(([path, content]) => ({
      path,
      content,
      tokens: estimateTokens(content),
    }))
    .sort((a, b) => {
      // Primary: priority score (lower = more important)
      const scoreDiff = priorityScore(a.path) - priorityScore(b.path);
      if (scoreDiff !== 0) return scoreDiff;
      // Secondary: shorter files first (maximise file count)
      return a.tokens - b.tokens;
    });

  const parts: string[] = [];

  // Reserve tokens for the header/separator overhead (~6 tokens per file)
  const overheadPerFile = 6;
  let remainingTokens = maxTokens;

  for (const entry of entries) {
    if (remainingTokens <= 0) break;

    const separator = `\n// === ${entry.path} ===\n`;
    const separatorTokens = estimateTokens(separator);
    const availableForContent = remainingTokens - separatorTokens - overheadPerFile;

    if (availableForContent <= 0) break;

    if (entry.tokens <= availableForContent) {
      parts.push(separator + entry.content);
      remainingTokens -= separatorTokens + entry.tokens + overheadPerFile;
    } else {
      // Partially include this file with a truncation notice
      const truncationNotice = "\n// [truncated — file too large for context window]";
      const noticeTokens = estimateTokens(truncationNotice);
      const truncated = truncateToTokens(
        entry.content,
        availableForContent - noticeTokens,
      );
      if (truncated.length > 0) {
        parts.push(separator + truncated + truncationNotice);
        remainingTokens = 0; // Treat as exhausted after a truncation
      }
      break;
    }
  }

  return parts.join("\n");
}
