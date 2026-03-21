import type { Plan } from "@/types/project";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AI-Auto-SaaS";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const PLAN_LIMITS: Record<Plan, number> = {
  FREE: 2,
  STARTER: 10,
  PRO: 50,
  ENTERPRISE: 9999,
};

export const PLAN_PRICES: Record<Plan, number> = {
  FREE: 0,
  STARTER: 29,
  PRO: 79,
  ENTERPRISE: 299,
};

export const PLAN_FEATURES: Record<Plan, string[]> = {
  FREE: ["2 static projects/month", "Basic templates", "GitHub push", "Community support"],
  STARTER: [
    "10 projects/month",
    "Static + Dynamic projects",
    "All templates",
    "GitHub push",
    "Email support",
  ],
  PRO: [
    "50 projects/month",
    "All project tiers",
    "Priority generation",
    "GitHub push + auto-deploy",
    "Priority support",
  ],
  ENTERPRISE: [
    "Unlimited projects",
    "All project tiers",
    "Dedicated AI capacity",
    "GitHub push + auto-deploy",
    "Dedicated support",
    "Custom templates",
  ],
};

export const TIER_LABELS = {
  STATIC: "Static",
  DYNAMIC: "Dynamic",
  FULLSTACK: "Full-Stack",
} as const;

export const STATUS_LABELS = {
  DRAFT: "Draft",
  QUEUED: "Queued",
  PLANNING: "Planning",
  GENERATING: "Generating",
  REVIEWING: "Reviewing",
  PUSHING: "Pushing to GitHub",
  DEPLOYING: "Deploying",
  COMPLETED: "Completed",
  FAILED: "Failed",
} as const;

export const GENERATION_QUEUE_NAME = "generation";
export const MAX_GENERATION_RETRIES = 3;
export const GENERATION_BACKOFF_MS = 2000;
