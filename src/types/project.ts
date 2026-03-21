export type ProjectTier = "STATIC" | "DYNAMIC" | "FULLSTACK";

export type ProjectStatus =
  | "DRAFT"
  | "QUEUED"
  | "PLANNING"
  | "GENERATING"
  | "REVIEWING"
  | "PUSHING"
  | "DEPLOYING"
  | "COMPLETED"
  | "FAILED";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";

export type Plan = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface GenerationConfig {
  database?: "postgresql" | "mysql" | "mongodb" | "supabase" | "planetscale" | "sqlite" | "none";
  auth?: "supabase" | "clerk" | "nextauth" | "firebase" | "none";
  payments?: "stripe" | "razorpay" | "lemonsqueezy" | "none";
  styling?: "tailwind" | "shadcn" | "chakra" | "css";
  deployment?: "vercel" | "netlify" | "railway" | "render" | "docker";
  email?: "resend" | "sendgrid" | "none";
  storage?: "s3" | "cloudflare-r2" | "none";
  analytics?: boolean;
  additionalNotes?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  requirement: string;
  tier: ProjectTier;
  status: ProjectStatus;
  config: GenerationConfig;
  githubRepo?: string | null;
  githubPat?: string | null;
  architecture?: ArchitecturePlan | null;
  generatedFiles?: string[] | null;
  errorLog?: string | null;
  deploymentUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildLog {
  id: string;
  projectId: string;
  step: string;
  message: string;
  level: LogLevel;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ArchitecturePlan {
  projectName: string;
  description: string;
  files: FileSpec[];
  dbSchema?: string;
  envVars: string[];
  packages: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  pages: string[];
  apiRoutes: string[];
  keyDecisions: string[];
}

export interface FileSpec {
  path: string;
  purpose: string;
  dependencies: string[];
  complexity: "low" | "medium" | "high";
  preferredModel: "claude" | "gemini";
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  plan: Plan;
  status: string;
  currentPeriodEnd?: Date | null;
  generationsUsed: number;
  generationsLimit: number;
}
