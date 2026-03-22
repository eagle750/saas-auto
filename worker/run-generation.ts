/**
 * Long-running worker: claims `QUEUED` projects from Postgres and runs the pipeline.
 * No Redis/BullMQ — run alongside the app: `npm run worker`
 */
import { runGenerationPipeline } from "../src/ai/orchestrator";
import { prisma } from "../src/lib/prisma";

const POLL_MS_WHEN_IDLE = 2000;

async function claimNextQueuedProject() {
  const candidates = await prisma.project.findMany({
    where: { status: "QUEUED" },
    orderBy: { updatedAt: "asc" },
    take: 8,
  });

  for (const c of candidates) {
    const locked = await prisma.project.updateMany({
      where: { id: c.id, status: "QUEUED" },
      data: { status: "PLANNING" },
    });
    if (locked.count === 1) {
      return prisma.project.findUnique({ where: { id: c.id } });
    }
  }
  return null;
}

async function runLoop() {
  for (;;) {
    try {
      const project = await claimNextQueuedProject();
      if (!project) {
        await new Promise((r) => setTimeout(r, POLL_MS_WHEN_IDLE));
        continue;
      }

      try {
        await runGenerationPipeline(project);
        console.log(`[worker] Completed project ${project.id}`);
      } catch (err) {
        console.error(`[worker] Pipeline failed for ${project.id}:`, err);
        try {
          await prisma.project.update({
            where: { id: project.id },
            data: {
              status: "FAILED",
              errorLog: err instanceof Error ? err.message : String(err),
            },
          });
        } catch (updateErr) {
          console.error(`[worker] Failed to mark FAILED:`, updateErr);
        }
      }
    } catch (err) {
      console.error("[worker] Loop error:", err);
      await new Promise((r) => setTimeout(r, POLL_MS_WHEN_IDLE));
    }
  }
}

void runLoop();
