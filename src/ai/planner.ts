import type { ArchitecturePlan, FileSpec } from "@/types/project";
import type { PlanArchitectureInput } from "@/types/ai";
import { PLANNING_SYSTEM_PROMPT } from "./prompts/planning";
import { claudeClient } from "./clients/claude";

/**
 * Topologically sort files so that every dependency appears before the file
 * that depends on it. Uses Kahn's algorithm (BFS) on a dependency graph.
 *
 * If a cycle is detected the function returns the original order with cyclic
 * files appended at the end — this is a graceful fallback that prevents a hang.
 *
 * @param files - The file specs to sort.
 * @returns A new array with files ordered by dependency.
 */
export function topologicalSort(files: FileSpec[]): FileSpec[] {
  if (files.length === 0) return [];

  const pathToSpec = new Map<string, FileSpec>();
  for (const file of files) {
    pathToSpec.set(file.path, file);
  }

  // Build adjacency list and in-degree map
  // Edge: A → B means B depends on A (A must come before B)
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // dependency → files that depend on it

  for (const file of files) {
    if (!inDegree.has(file.path)) inDegree.set(file.path, 0);
    if (!dependents.has(file.path)) dependents.set(file.path, []);
  }

  for (const file of files) {
    for (const dep of file.dependencies) {
      // Only consider dependencies that are part of the plan
      if (!pathToSpec.has(dep)) continue;

      dependents.get(dep)!.push(file.path);
      inDegree.set(file.path, (inDegree.get(file.path) ?? 0) + 1);
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [path, degree] of inDegree) {
    if (degree === 0) queue.push(path);
  }

  const sorted: FileSpec[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const spec = pathToSpec.get(current);
    if (spec) sorted.push(spec);

    for (const dependent of dependents.get(current) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) queue.push(dependent);
    }
  }

  // Append any remaining files (cyclic or disconnected)
  for (const file of files) {
    if (!visited.has(file.path)) {
      sorted.push(file);
    }
  }

  return sorted;
}

/**
 * Parse and validate Claude's JSON response into an ArchitecturePlan.
 * Throws a descriptive error if the response is malformed.
 */
function parseArchitecturePlan(jsonString: string): ArchitecturePlan {
  let parsed: unknown;

  // Strip any accidental markdown fences
  const cleaned = jsonString
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse Claude's response as JSON. Response preview:\n${cleaned.slice(0, 500)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Architecture plan response is not a JSON object");
  }

  const plan = parsed as Record<string, unknown>;

  // Validate required fields
  const requiredFields = [
    "projectName",
    "description",
    "files",
    "envVars",
    "packages",
    "pages",
    "apiRoutes",
    "keyDecisions",
  ] as const;

  for (const field of requiredFields) {
    if (!(field in plan)) {
      throw new Error(`Architecture plan missing required field: "${field}"`);
    }
  }

  if (!Array.isArray(plan.files)) {
    throw new Error('Architecture plan "files" must be an array');
  }

  // Validate each file spec
  for (const [index, file] of (plan.files as unknown[]).entries()) {
    if (typeof file !== "object" || file === null) {
      throw new Error(`files[${index}] is not an object`);
    }
    const f = file as Record<string, unknown>;

    if (typeof f.path !== "string" || f.path.trim() === "") {
      throw new Error(`files[${index}].path must be a non-empty string`);
    }
    if (typeof f.purpose !== "string") {
      throw new Error(`files[${index}].purpose must be a string`);
    }
    if (!Array.isArray(f.dependencies)) {
      // Gracefully default to empty array
      f.dependencies = [];
    }
    if (!["low", "medium", "high"].includes(f.complexity as string)) {
      f.complexity = "medium";
    }
    if (!["claude", "gemini"].includes(f.preferredModel as string)) {
      f.preferredModel = "claude";
    }
  }

  // Validate packages structure
  if (typeof plan.packages !== "object" || plan.packages === null) {
    throw new Error('Architecture plan "packages" must be an object');
  }
  const pkgs = plan.packages as Record<string, unknown>;
  if (typeof pkgs.dependencies !== "object") pkgs.dependencies = {};
  if (typeof pkgs.devDependencies !== "object") pkgs.devDependencies = {};

  // Ensure array fields
  if (!Array.isArray(plan.envVars)) plan.envVars = [];
  if (!Array.isArray(plan.pages)) plan.pages = [];
  if (!Array.isArray(plan.apiRoutes)) plan.apiRoutes = [];
  if (!Array.isArray(plan.keyDecisions)) plan.keyDecisions = [];

  return plan as unknown as ArchitecturePlan;
}

/**
 * Plan the architecture for a new project using Claude.
 *
 * Sends the project requirement and configuration to Claude with the planning
 * system prompt, parses the JSON response, topologically sorts the files,
 * and returns the complete ArchitecturePlan.
 *
 * @param input - The planning input containing requirement, tier, and config.
 * @returns The validated and sorted ArchitecturePlan.
 */
export async function planArchitecture(
  input: PlanArchitectureInput,
): Promise<ArchitecturePlan> {
  const { requirement, tier, config } = input;

  const configDescription = Object.entries(config)
    .filter(([, value]) => value !== undefined && value !== "none")
    .map(([key, value]) => `- ${key}: ${String(value)}`)
    .join("\n");

  const userMessage = `Plan a complete Next.js application with the following specifications:

## Project Requirement
${requirement}

## Project Tier
${tier}

## Technology Configuration
${configDescription || "- No specific technologies configured (use sensible defaults)"}

## Instructions
1. Produce a complete architecture plan as valid JSON
2. Include ALL files needed for a production application
3. Order files so dependencies come before dependents
4. Assign the correct preferredModel (claude/gemini) based on file purpose
5. Include all necessary environment variables for the configured technologies`;

  const response = await claudeClient.generate(
    [{ role: "user", content: userMessage }],
    {
      systemPrompt: PLANNING_SYSTEM_PROMPT,
      maxTokens: 8192,
      temperature: 0.3, // Lower temperature for more consistent structured output
    },
  );

  const plan = parseArchitecturePlan(response.content);

  // Topologically sort files so generation order is correct
  plan.files = topologicalSort(plan.files);

  return plan;
}
