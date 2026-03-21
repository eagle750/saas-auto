import { estimateTokens, truncateToTokens } from "./tokenCounter";

/**
 * Split a large map of files into smaller chunks, each fitting within chunkSize tokens.
 *
 * Files are never split across chunks — if a single file exceeds chunkSize it is placed
 * in its own chunk. The algorithm greedily fills each chunk before starting the next.
 *
 * @param files - Map of file path → file content.
 * @param chunkSize - Maximum tokens per chunk.
 * @returns Array of Maps, each containing a subset of files.
 */
export function splitFilesIntoChunks(
  files: Map<string, string>,
  chunkSize: number,
): Map<string, string>[] {
  if (files.size === 0) return [];

  const chunks: Map<string, string>[] = [];
  let currentChunk = new Map<string, string>();
  let currentTokens = 0;

  for (const [path, content] of files) {
    const fileTokens = estimateTokens(content);

    if (currentTokens + fileTokens > chunkSize && currentChunk.size > 0) {
      // Flush the current chunk and start a new one
      chunks.push(currentChunk);
      currentChunk = new Map<string, string>();
      currentTokens = 0;
    }

    currentChunk.set(path, content);
    currentTokens += fileTokens;
  }

  if (currentChunk.size > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Determine which files are most relevant to the current file being generated.
 *
 * Relevance scoring:
 * 1. Files that the current file directly imports (highest relevance)
 * 2. Files in the same directory
 * 3. Type definition files (src/types/)
 * 4. Shared utility files (src/lib/, src/utils/)
 * 5. All other files (lowest relevance, included only if budget allows)
 *
 * @param files - Map of all generated file paths → content.
 * @param currentFile - The path of the file currently being generated.
 * @param maxTokens - Maximum token budget for the returned context string.
 * @returns A formatted context string with the most relevant file contents.
 */
export function getRelevantContext(
  files: Map<string, string>,
  currentFile: string,
  maxTokens: number,
): string {
  if (files.size === 0) return "";

  const currentDir = currentFile.includes("/")
    ? currentFile.slice(0, currentFile.lastIndexOf("/"))
    : "";

  interface ScoredFile {
    path: string;
    content: string;
    score: number;
    tokens: number;
  }

  // Score every file by relevance to the current file
  const scored: ScoredFile[] = [];

  for (const [path, content] of files) {
    if (path === currentFile) continue;

    let score = 0;

    // 1. Direct import — check if the current file's name appears in any import statement
    const fileBasename = path.replace(/\.[^/.]+$/, ""); // strip extension
    const importPattern = new RegExp(
      `from\\s+['"](?:@/|\\./|\\.\\./)*${escapeRegExp(fileBasename)}['"]`,
    );
    if (importPattern.test(content) || importPattern.test(currentFile)) {
      score += 100;
    }

    // 2. Same directory
    const fileDir = path.includes("/")
      ? path.slice(0, path.lastIndexOf("/"))
      : "";
    if (fileDir === currentDir) {
      score += 40;
    }

    // 3. Type definitions
    if (path.startsWith("src/types/") || path.includes("/types/")) {
      score += 60;
    }

    // 4. Shared utilities and lib files
    if (
      path.startsWith("src/lib/") ||
      path.startsWith("src/utils/") ||
      path.includes("/lib/") ||
      path.includes("/utils/")
    ) {
      score += 30;
    }

    // 5. Shared UI components
    if (path.includes("/components/ui/")) {
      score += 20;
    }

    // 6. Config files
    if (
      path === "next.config.ts" ||
      path === "tailwind.config.ts" ||
      path.includes("prisma/schema")
    ) {
      score += 25;
    }

    scored.push({
      path,
      content,
      score,
      tokens: estimateTokens(content),
    });
  }

  // Sort by descending relevance score, then ascending token count (prefer smaller files when equal)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.tokens - b.tokens;
  });

  // Build context string within token budget
  const SEPARATOR_TOKENS = 8; // overhead per file for separator lines
  let remainingTokens = maxTokens;
  const parts: string[] = [];

  for (const entry of scored) {
    if (remainingTokens <= 0) break;

    const separatorText = `\n// === ${entry.path} ===\n`;
    const separatorTokens = estimateTokens(separatorText);
    const available = remainingTokens - separatorTokens - SEPARATOR_TOKENS;

    if (available <= 0) break;

    if (entry.tokens <= available) {
      parts.push(separatorText + entry.content);
      remainingTokens -= separatorTokens + entry.tokens + SEPARATOR_TOKENS;
    } else {
      // Partially include if it has high relevance (score >= 30)
      if (entry.score >= 30) {
        const notice = "\n// [truncated]";
        const truncated = truncateToTokens(
          entry.content,
          available - estimateTokens(notice),
        );
        if (truncated.length > 0) {
          parts.push(separatorText + truncated + notice);
        }
      }
      // After partial inclusion or skip, stop adding more files
      break;
    }
  }

  return parts.join("\n");
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
