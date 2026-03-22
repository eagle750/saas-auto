export const QUEUE_NAME = "generation";

/** Next sets this while running `next build` (including on Vercel). */
function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Parse a Redis URL string into the individual ioredis connection options
 * that BullMQ expects (host, port, password, db, tls).
 */
export function parseRedisUrl(url: string): {
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

/** Trimmed non-empty URL, or undefined (empty env var must not bypass ?? and hit localhost). */
export function resolvedRedisUrl(): string {
  const raw = process.env.REDIS_URL?.trim();
  return raw || "redis://localhost:6379";
}

export function buildBullmqRedisConnection() {
  const raw = process.env.REDIS_URL?.trim();
  const url = resolvedRedisUrl();
  return {
    lazyConnect: true,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
    ...(raw
      ? { path: undefined, host: undefined, port: undefined }
      : {}),
    ...parseRedisUrl(url),
  };
}

type GenJob = { projectId: string };

let generationQueue: import("bullmq").Queue<GenJob> | undefined;

async function getGenerationQueue(): Promise<import("bullmq").Queue<GenJob>> {
  if (isNextProductionBuild()) {
    throw new Error("[generation-queue] Queue must not be used during next build");
  }
  if (!generationQueue) {
    const { Queue } = await import("bullmq");
    generationQueue = new Queue<GenJob>(QUEUE_NAME, {
      connection: buildBullmqRedisConnection(),
      skipMetasUpdate: true,
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
  }
  return generationQueue;
}

export async function addGenerationJob(projectId: string): Promise<void> {
  if (isNextProductionBuild()) {
    return;
  }
  const q = await getGenerationQueue();
  await q.add(
    `generate:${projectId}`,
    { projectId },
    {
      jobId: `generate:${projectId}:${Date.now()}`,
    }
  );
}
