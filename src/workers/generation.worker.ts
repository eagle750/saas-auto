import { Worker, type Job } from "bullmq";
import { runGenerationPipeline } from "@/ai/orchestrator";
import {
  QUEUE_NAME,
  buildBullmqRedisConnection,
} from "@/lib/generation-queue";
import { prisma } from "@/lib/prisma";

export const generationWorker = new Worker<{ projectId: string }>(
  QUEUE_NAME,
  async (job: Job<{ projectId: string }>) => {
    const { projectId } = job.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    await runGenerationPipeline(project);
  },
  {
    connection: buildBullmqRedisConnection(),
    concurrency: 2,
  }
);

generationWorker.on("failed", async (job, err) => {
  if (!job) return;

  const { projectId } = job.data;
  console.error(`[generation.worker] Job ${job.id} failed for project ${projectId}:`, err);

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorLog: err instanceof Error ? err.message : String(err),
      },
    });
  } catch (updateErr) {
    console.error(
      `[generation.worker] Failed to mark project ${projectId} as FAILED:`,
      updateErr
    );
  }
});

generationWorker.on("completed", (job) => {
  console.log(
    `[generation.worker] Job ${job.id} completed for project ${job.data.projectId}`
  );
});

generationWorker.on("error", (err) => {
  console.error("[generation.worker] Worker error:", err);
});
