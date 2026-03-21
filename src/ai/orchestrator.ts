import { prisma } from "@/lib/prisma";
import { publishBuildLog } from "@/lib/redis";
import { pushToGitHub } from "@/lib/github";
import { decrypt } from "@/lib/crypto";
import { planArchitecture, topologicalSort } from "./planner";
import { generateFile, selectModel } from "./generator";
import { reviewCode } from "./reviewer";
import { validateAllFiles } from "./utils/codeValidator";
import type { Project, BuildLog, GenerationConfig, ArchitecturePlan } from "@/types/project";
import type { Prisma } from "@prisma/client";

type PrismaProject = Prisma.ProjectGetPayload<object>;

async function updateStatus(projectId: string, status: string): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: { status: status as PrismaProject["status"] },
  });
}

async function saveArchitecturePlan(projectId: string, plan: ArchitecturePlan): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: { architecture: plan as unknown as Prisma.InputJsonValue },
  });
}

async function saveGeneratedFiles(projectId: string, files: string[]): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: { generatedFiles: files as unknown as Prisma.InputJsonValue },
  });
}

async function saveError(projectId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.project.update({
    where: { id: projectId },
    data: { errorLog: message },
  });
}

async function emitLog(
  projectId: string,
  step: string,
  message: string,
  level: BuildLog["level"] = "INFO"
): Promise<void> {
  const timestamp = new Date().toISOString();
  const logData = { step, message, level, timestamp };

  // Save to DB
  await prisma.buildLog.create({
    data: {
      projectId,
      step,
      message,
      level,
      metadata: { timestamp } as Prisma.InputJsonValue,
    },
  });

  // Publish to Redis for SSE streaming
  await publishBuildLog(projectId, logData).catch(() => {
    // Redis publish failure is non-fatal
    console.warn(`Failed to publish build log for project ${projectId}`);
  });
}

/**
 * Main AI generation pipeline. Runs through 6 stages:
 * Plan → Generate → Review → Validate → Push → Complete
 */
export async function runGenerationPipeline(project: PrismaProject): Promise<void> {
  const config = project.config as unknown as GenerationConfig;
  const projectId = project.id;

  try {
    // ── STAGE 1: CLASSIFY & PLAN ──────────────────────────────────────────
    await updateStatus(projectId, "PLANNING");
    await emitLog(projectId, "planning", "Analyzing your requirements...", "INFO");

    const architecturePlan = await planArchitecture({
      requirement: project.requirement,
      tier: project.tier as "STATIC" | "DYNAMIC" | "FULLSTACK",
      config,
    });

    await saveArchitecturePlan(projectId, architecturePlan);
    await emitLog(
      projectId,
      "planning",
      `Architecture planned: ${architecturePlan.files.length} files to generate`,
      "SUCCESS"
    );

    // ── STAGE 2: GENERATE CODE FILES ──────────────────────────────────────
    await updateStatus(projectId, "GENERATING");

    const generationOrder = topologicalSort(architecturePlan.files);
    const generatedFiles = new Map<string, string>();
    let filesGenerated = 0;

    for (const fileSpec of generationOrder) {
      await emitLog(projectId, `generating`, `Writing ${fileSpec.path}...`, "INFO");

      const model = selectModel(fileSpec);

      try {
        const code = await generateFile({
          fileSpec,
          architecturePlan,
          previousFiles: generatedFiles,
          config,
          model,
        });

        generatedFiles.set(fileSpec.path, code);
        filesGenerated++;
        await emitLog(
          projectId,
          `generating`,
          `✓ ${fileSpec.path} (${filesGenerated}/${generationOrder.length})`,
          "SUCCESS"
        );

        // Save progress periodically
        if (filesGenerated % 5 === 0) {
          await saveGeneratedFiles(projectId, Array.from(generatedFiles.keys()));
        }
      } catch (fileError) {
        const message = fileError instanceof Error ? fileError.message : String(fileError);
        await emitLog(
          projectId,
          `generating`,
          `⚠ Failed to generate ${fileSpec.path}: ${message}`,
          "WARN"
        );
        // Continue with other files even if one fails
      }
    }

    await saveGeneratedFiles(projectId, Array.from(generatedFiles.keys()));
    await emitLog(
      projectId,
      "generating",
      `Generated ${generatedFiles.size} files successfully`,
      "SUCCESS"
    );

    // ── STAGE 3: SELF-REVIEW & FIX ────────────────────────────────────────
    await updateStatus(projectId, "REVIEWING");
    await emitLog(projectId, "reviewing", "Running AI code review...", "INFO");

    const reviewResults = await reviewCode({
      files: generatedFiles,
      architecturePlan,
      config,
    });

    for (const fix of reviewResults.fixes) {
      await emitLog(
        projectId,
        "reviewing",
        `Fixing: ${fix.issue} in ${fix.file}`,
        "INFO"
      );
      generatedFiles.set(fix.file, fix.fixedCode);
    }

    await emitLog(
      projectId,
      "reviewing",
      `Review complete. Applied ${reviewResults.fixes.length} fixes.`,
      "SUCCESS"
    );

    // ── STAGE 4: VALIDATE ─────────────────────────────────────────────────
    await emitLog(projectId, "validating", "Validating generated code...", "INFO");

    try {
      await validateAllFiles(generatedFiles);
      await emitLog(projectId, "validating", "All files validated successfully", "SUCCESS");
    } catch (validationError) {
      const msg = validationError instanceof Error ? validationError.message : String(validationError);
      await emitLog(projectId, "validating", `Validation warning: ${msg}`, "WARN");
      // Non-fatal: continue with push
    }

    // ── STAGE 5: PUSH TO GITHUB ───────────────────────────────────────────
    if (project.githubRepo && project.githubPat) {
      await updateStatus(projectId, "PUSHING");
      await emitLog(
        projectId,
        "pushing",
        `Pushing ${generatedFiles.size} files to ${project.githubRepo}...`,
        "INFO"
      );

      let decryptedPat: string;
      try {
        decryptedPat = decrypt(project.githubPat);
      } catch {
        decryptedPat = project.githubPat; // Fallback if not encrypted
      }

      await pushToGitHub({
        repo: project.githubRepo,
        pat: decryptedPat,
        files: generatedFiles,
        commitMessage: `🚀 Generated by AI-Auto-SaaS\n\nRequirement: ${project.requirement.slice(0, 100)}${project.requirement.length > 100 ? "..." : ""}`,
      });

      await emitLog(
        projectId,
        "pushing",
        `Successfully pushed to ${project.githubRepo}!`,
        "SUCCESS"
      );
    } else {
      await emitLog(
        projectId,
        "pushing",
        "No GitHub repo configured. Skipping push.",
        "WARN"
      );
    }

    // ── STAGE 6: COMPLETE ─────────────────────────────────────────────────
    await updateStatus(projectId, "COMPLETED");
    await emitLog(
      projectId,
      "complete",
      `🎉 Your SaaS is ready! Generated ${generatedFiles.size} files.`,
      "SUCCESS"
    );

    if (project.githubRepo) {
      await emitLog(
        projectId,
        "complete",
        `View your repo: https://github.com/${project.githubRepo}`,
        "INFO"
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateStatus(projectId, "FAILED");
    await emitLog(projectId, "error", `Generation failed: ${message}`, "ERROR");
    await saveError(projectId, error);
    throw error;
  }
}
