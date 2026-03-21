"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
  code: string;
  language: string;
  filename: string;
}

export function CodePreview({ code, language, filename }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: no-op if clipboard not available
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-[#0D1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-[#161B22] px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium text-foreground">
            {filename}
          </span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {language}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={copied ? "Copied" : "Copy code"}
            onClick={handleCopy}
            className="size-7"
          >
            {copied ? (
              <Check className="size-3.5 text-[#10B981]" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={() => setExpanded((prev) => !prev)}
            className="size-7"
          >
            {expanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Code block */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          expanded ? "max-h-[600px]" : "max-h-0"
        )}
      >
        <div className="overflow-auto">
          <pre className="p-4 text-sm leading-relaxed text-[#E6EDF3] font-mono">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* Collapsed hint */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Show {code.split("\n").length} lines
        </button>
      )}
    </div>
  );
}

export default CodePreview;
