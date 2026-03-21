"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProjectTier } from "@/types/project";

interface RequirementInputProps {
  value: string;
  onChange: (val: string) => void;
  onTierDetected?: (tier: ProjectTier) => void;
}

const MAX_CHARS = 2000;

const EXAMPLE_PROMPTS = [
  "A landing page for my SaaS product with hero section, features, pricing table, and contact form",
  "A dashboard with user authentication, CRUD for blog posts, and an admin panel with roles",
  "A full SaaS app with auth, Stripe subscriptions, team workspaces, and a REST API",
  "A personal portfolio site with project showcase, blog, and contact form",
  "A multi-tenant project management tool with Kanban boards and real-time updates",
];

const STATIC_KEYWORDS = [
  "landing page",
  "portfolio",
  "static site",
  "marketing site",
  "one-page",
  "brochure",
  "showcase",
];

const DYNAMIC_KEYWORDS = [
  "dashboard",
  "crud",
  "admin",
  "blog",
  "cms",
  "database",
  "api",
  "authentication",
  "login",
  "register",
  "user management",
];

const FULLSTACK_KEYWORDS = [
  "saas",
  "subscription",
  "stripe",
  "payment",
  "billing",
  "multi-tenant",
  "team workspace",
  "real-time",
  "websocket",
  "enterprise",
  "razorpay",
  "lemon squeezy",
];

function detectTier(text: string): ProjectTier | null {
  const lower = text.toLowerCase();

  const fullstackScore = FULLSTACK_KEYWORDS.filter((kw) =>
    lower.includes(kw)
  ).length;
  const dynamicScore = DYNAMIC_KEYWORDS.filter((kw) =>
    lower.includes(kw)
  ).length;
  const staticScore = STATIC_KEYWORDS.filter((kw) =>
    lower.includes(kw)
  ).length;

  if (fullstackScore >= 1) return "FULLSTACK";
  if (dynamicScore >= 2) return "DYNAMIC";
  if (staticScore >= 1 && dynamicScore === 0 && fullstackScore === 0)
    return "STATIC";

  return null;
}

export function RequirementInput({
  value,
  onChange,
  onTierDetected,
}: RequirementInputProps) {
  const prevDetectedTier = useRef<ProjectTier | null>(null);
  const charCount = value.length;
  const isOverLimit = charCount > MAX_CHARS;

  useEffect(() => {
    if (!onTierDetected) return;
    const detected = detectTier(value);
    if (detected && detected !== prevDetectedTier.current) {
      prevDetectedTier.current = detected;
      onTierDetected(detected);
    }
  }, [value, onTierDetected]);

  function handleChipClick(prompt: string) {
    onChange(prompt);
  }

  return (
    <div className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS + 50))}
          placeholder={
            "Describe your project in detail...\n\nExample: A SaaS dashboard with user authentication, role-based access, project management features, Stripe subscriptions, and a REST API."
          }
          className={cn(
            "min-h-[160px] resize-y text-sm leading-relaxed pr-16",
            isOverLimit && "border-red-500 focus-visible:ring-red-500/30"
          )}
        />
        {/* Character counter */}
        <span
          className={cn(
            "pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums",
            isOverLimit
              ? "text-red-400"
              : charCount > MAX_CHARS * 0.85
              ? "text-amber-400"
              : "text-muted-foreground"
          )}
        >
          {charCount}/{MAX_CHARS}
        </span>
      </div>

      {isOverLimit && (
        <p className="text-xs text-red-400">
          Character limit exceeded by {charCount - MAX_CHARS} characters.
        </p>
      )}

      {/* Example prompts */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Example prompts (click to use):
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => {
            const shortened =
              prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt;
            return (
              <button
                key={prompt}
                type="button"
                onClick={() => handleChipClick(prompt)}
                className={cn(
                  "rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground",
                  "transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400",
                  value === prompt && "border-blue-500/50 bg-blue-500/10 text-blue-400"
                )}
                title={prompt}
              >
                {shortened}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RequirementInput;
