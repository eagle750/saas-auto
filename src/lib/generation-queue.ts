import { Queue } from "bullmq";

export const QUEUE_NAME = "generation";

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

let generationQueue: Queue<{ projectId: string }> | undefined;

function getGenerationQueue(): Queue<{ projectId: string }> {
  if (!generationQueue) {
    generationQueue = new Queue<{ projectId: string }>(QUEUE_NAME, {
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
  await getGenerationQueue().add(
    `generate:${projectId}`,
    { projectId },
    {
      jobId: `generate:${projectId}:${Date.now()}`,
    }
  );
}
