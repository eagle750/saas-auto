import type { ArchitecturePlan, FileSpec, GenerationConfig, ProjectTier } from "./project";

export interface PlanArchitectureInput {
  requirement: string;
  tier: ProjectTier;
  config: GenerationConfig;
}

export interface GenerateFileInput {
  fileSpec: FileSpec;
  architecturePlan: ArchitecturePlan;
  previousFiles: Map<string, string>;
  config: GenerationConfig;
  model: "claude" | "gemini";
}

export interface ReviewCodeInput {
  files: Map<string, string>;
  architecturePlan: ArchitecturePlan;
  config: GenerationConfig;
}

export interface CodeFix {
  file: string;
  issue: string;
  fixedCode: string;
}

export interface ReviewResult {
  fixes: CodeFix[];
  summary: string;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
