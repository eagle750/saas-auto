import { Queue, Worker, type Job } from "bullmq";
import { runGenerationPipeline } from "@/ai/orchestrator";
import { prisma } from "@/lib/prisma";

const QUEUE_NAME = "generation";

const redisConnection = {
  connection: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
    maxRetriesPerRequest: null as null,
  },
};

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export const generationQueue = new Queue<{ projectId: string }>(QUEUE_NAME, {
  connection: {
    // ioredis-compatible connection options required by BullMQ
    ...(process.env.REDIS_URL
      ? { path: undefined, host: undefined, port: undefined }
      : {}),
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Pass the full URL via the `url` shorthand supported by ioredis
    ...parseRedisUrl(process.env.REDIS_URL ?? "redis://localhost:6379"),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

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
    connection: {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...parseRedisUrl(process.env.REDIS_URL ?? "redis://localhost:6379"),
    },
    concurrency: 2,
  }
);

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public helper
// ---------------------------------------------------------------------------

export async function addGenerationJob(projectId: string): Promise<void> {
  await generationQueue.add(
    `generate:${projectId}`,
    { projectId },
    {
      jobId: `generate:${projectId}:${Date.now()}`,
    }
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Parse a Redis URL string into the individual ioredis connection options
 * that BullMQ expects (host, port, password, db, tls).
 */
function parseRedisUrl(url: string): {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: object;
  username?: string;
} {
  try {
    const parsed = new URL(url);
    const tls =
      parsed.protocol === "rediss:" ? { rejectUnauthorized: false } : undefined;

    return {
      host: parsed.hostname || "127.0.0.1",
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
      ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
      ...(parsed.pathname && parsed.pathname.length > 1
        ? { db: parseInt(parsed.pathname.slice(1), 10) }
        : {}),
      ...(tls ? { tls } : {}),
    };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}
