import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

let buildPhaseRedisStub: Redis | undefined;

function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/** No sockets during `next build` if a route is probed. */
function buildTimeRedisStub(): Redis {
  const stub = {
    duplicate: () => stub,
    publish: async () => 0,
    on: () => stub,
    once: () => stub,
    subscribe: async () => undefined,
    unsubscribe: async () => undefined,
    removeListener: () => stub,
    quit: async () => "OK",
    disconnect: () => {},
    status: "ready" as const,
  };
  return stub as unknown as Redis;
}

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

/** Lazily create Redis; stub during Next production build (no TCP). */
export function getRedis(): Redis {
  if (isNextProductionBuild()) {
    return (buildPhaseRedisStub ??= buildTimeRedisStub());
  }
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
  if (isNextProductionBuild()) {
    return;
  }
  await getRedis().publish(`build:${projectId}`, JSON.stringify(data));
}
