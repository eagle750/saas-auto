/**
 * Basic syntax and quality validation for generated TypeScript/JavaScript files.
 *
 * This module performs lightweight static checks that catch common code generation
 * failures without requiring a full TypeScript compiler invocation. It is intentionally
 * conservative — it only flags issues it is confident about.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Patterns that indicate placeholder / unfinished code
const PLACEHOLDER_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /\bTODO\s*:\s*implement\b/i,
    description: 'Placeholder text "TODO: implement" found',
  },
  {
    pattern: /\bYOUR_CODE_HERE\b/,
    description: 'Placeholder text "YOUR_CODE_HERE" found',
  },
  {
    pattern: /\bINSERT_CODE_HERE\b/,
    description: 'Placeholder text "INSERT_CODE_HERE" found',
  },
  {
    pattern: /\bADD_YOUR_\w+_HERE\b/i,
    description: "Generic placeholder text found",
  },
  {
    pattern: /\/\/\s*\.{3}\s*$/m,
    description: 'Incomplete implementation indicated by "// ..." comment',
  },
  {
    pattern: /throw new Error\(['"]not implemented['"]\)/i,
    description: '"Not implemented" error throw found — file may be incomplete',
  },
  {
    pattern: /\/\*\s*TODO\s*\*\//i,
    description: "Block TODO comment found",
  },
];

// Markdown code fence detection — means the AI wrapped the output
const MARKDOWN_FENCE_PATTERN = /^```/m;

/**
 * Validate a single generated file for syntax and quality issues.
 *
 * @param path - The file path (used to determine file type and context).
 * @param content - The raw file content string.
 * @returns ValidationResult with valid flag and list of error messages.
 */
export function validateFile(path: string, content: string): ValidationResult {
  const errors: string[] = [];

  // ── Sanity checks ────────────────────────────────────────────────────────────

  if (!content || content.trim().length === 0) {
    return { valid: false, errors: ["File is empty"] };
  }

  // ── Markdown fence detection ─────────────────────────────────────────────────

  if (MARKDOWN_FENCE_PATTERN.test(content)) {
    errors.push(
      "File content contains markdown code fences (```) — AI output was not stripped correctly",
    );
  }

  // ── Placeholder detection ────────────────────────────────────────────────────

  for (const { pattern, description } of PLACEHOLDER_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(description);
    }
  }

  // ── Bracket / delimiter balance ──────────────────────────────────────────────

  const ext = path.split(".").pop()?.toLowerCase();
  const isCodeFile = ["ts", "tsx", "js", "jsx"].includes(ext ?? "");

  if (isCodeFile) {
    const balanceErrors = checkDelimiterBalance(content);
    errors.push(...balanceErrors);
  }

  // ── Next.js specific checks ──────────────────────────────────────────────────

  if (isCodeFile) {
    const nextErrors = checkNextJsConventions(path, content);
    errors.push(...nextErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all files in a map and throw an error if any file has critical issues.
 *
 * Non-critical issues (placeholder text, style warnings) are collected but
 * only cause a throw if they appear alongside balance errors or missing exports.
 *
 * @param files - Map of file path → content.
 * @throws Error listing all files with critical validation failures.
 */
export async function validateAllFiles(
  files: Map<string, string>,
): Promise<void> {
  const criticalFailures: string[] = [];

  for (const [path, content] of files) {
    const result = validateFile(path, content);

    if (!result.valid) {
      // Classify errors: balance errors and missing exports are always critical
      const criticalErrors = result.errors.filter(
        (e) =>
          e.includes("Unbalanced") ||
          e.includes("empty") ||
          e.includes("markdown code fences") ||
          e.includes("missing default export"),
      );

      if (criticalErrors.length > 0) {
        criticalFailures.push(
          `${path}:\n  - ${criticalErrors.join("\n  - ")}`,
        );
      }
    }
  }

  if (criticalFailures.length > 0) {
    throw new Error(
      `Code validation failed for ${criticalFailures.length} file(s):\n\n` +
        criticalFailures.join("\n\n"),
    );
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Check that brackets, braces, and parentheses are balanced in source code.
 * Ignores occurrences inside string literals and single-line/block comments.
 */
function checkDelimiterBalance(content: string): string[] {
  const errors: string[] = [];

  let braces = 0;   // { }
  let brackets = 0; // [ ]
  let parens = 0;   // ( )

  let i = 0;
  const len = content.length;

  while (i < len) {
    const ch = content[i];

    // Skip single-line comments
    if (ch === "/" && content[i + 1] === "/") {
      while (i < len && content[i] !== "\n") i++;
      continue;
    }

    // Skip block comments
    if (ch === "/" && content[i + 1] === "*") {
      i += 2;
      while (i < len - 1 && !(content[i] === "*" && content[i + 1] === "/")) {
        i++;
      }
      i += 2;
      continue;
    }

    // Skip template literals (backtick strings) — they can contain ${} which would mess up counts
    if (ch === "`") {
      i++;
      let depth = 1;
      while (i < len && depth > 0) {
        if (content[i] === "`" && content[i - 1] !== "\\") {
          depth--;
        } else if (
          content[i] === "$" &&
          content[i + 1] === "{" &&
          content[i - 1] !== "\\"
        ) {
          // Nested expression — just skip, we can't easily balance these
          i++;
        }
        i++;
      }
      continue;
    }

    // Skip regular string literals
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < len) {
        if (content[i] === "\\" ) {
          i += 2; // skip escaped character
          continue;
        }
        if (content[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    switch (ch) {
      case "{": braces++; break;
      case "}": braces--; break;
      case "[": brackets++; break;
      case "]": brackets--; break;
      case "(": parens++; break;
      case ")": parens--; break;
    }

    i++;
  }

  if (braces !== 0) {
    errors.push(
      `Unbalanced curly braces: ${braces > 0 ? braces + " unclosed {" : Math.abs(braces) + " extra }"}`,
    );
  }
  if (brackets !== 0) {
    errors.push(
      `Unbalanced square brackets: ${brackets > 0 ? brackets + " unclosed [" : Math.abs(brackets) + " extra ]"}`,
    );
  }
  if (parens !== 0) {
    errors.push(
      `Unbalanced parentheses: ${parens > 0 ? parens + " unclosed (" : Math.abs(parens) + " extra )"}`,
    );
  }

  return errors;
}

/**
 * Check Next.js specific conventions.
 */
function checkNextJsConventions(path: string, content: string): string[] {
  const errors: string[] = [];

  const filename = path.split("/").pop() ?? "";

  // page.tsx and layout.tsx must have a default export
  if (filename === "page.tsx" || filename === "layout.tsx") {
    const hasDefaultExport =
      /export\s+default\s+(function|class|const|async\s+function)/.test(
        content,
      ) || /export\s+\{[^}]*default[^}]*\}/.test(content);

    if (!hasDefaultExport) {
      errors.push(
        `${filename} is missing a default export (required by Next.js App Router)`,
      );
    }
  }

  // error.tsx must be a client component
  if (filename === "error.tsx") {
    if (!/^['"]use client['"]/.test(content.trimStart())) {
      errors.push(
        'error.tsx must have "use client" directive (required by Next.js error boundaries)',
      );
    }
  }

  // Detect hooks used in likely Server Components (no "use client" but uses useState/useEffect)
  const isClientComponent = /^['"]use client['"]/.test(content.trimStart());
  const isServerAction =
    /^['"]use server['"]/.test(content.trimStart()) ||
    /['"]use server['"]/.test(content);

  if (!isClientComponent && !isServerAction) {
    const serverComponentHooks = [
      "useState",
      "useEffect",
      "useRef",
      "useReducer",
      "useLayoutEffect",
      "useImperativeHandle",
    ];

    for (const hook of serverComponentHooks) {
      // Only flag actual usage (not imports)
      const usagePattern = new RegExp(`\\b${hook}\\s*\\(`);
      const importPattern = new RegExp(`import[^;]+\\b${hook}\\b`);

      if (usagePattern.test(content) && !importPattern.test(content)) {
        errors.push(
          `React hook "${hook}" used without "use client" directive — Server Components cannot use hooks`,
        );
        break; // One warning per file is enough
      }
    }
  }

  return errors;
}
