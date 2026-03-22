import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL?.trim() || "redis://localhost:6379";
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("Redis client error:", err);
  });

  return client;
}

/** Lazily create Redis so Next.js build (loading API route modules) never opens a socket. */
export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = createRedisClient();
  }
  return globalForRedis.redis;
}

/**
 * Publish a build log event to a Redis channel.
 */
export async function publishBuildLog(
  projectId: string,
  data: { step: string; message: string; level: string; timestamp: string }
): Promise<void> {
  await getRedis().publish(`build:${projectId}`, JSON.stringify(data));
}
