import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createDummyProxy(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_, prop) {
      if (typeof prop === "symbol" || prop === "then") return undefined;
      throw new Error(`DATABASE_URL is not set. Cannot access prisma.${String(prop)}`);
    },
  });
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL?.trim();

  // `next build` without a DB URL (rare CI): avoid touching Neon during SSG analysis.
  if (!dbUrl && process.env.NEXT_PHASE === "phase-production-build") {
    return createDummyProxy();
  }

  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL is not set for this runtime. In Vercel: Project → Settings → Environment Variables — enable DATABASE_URL for Production (and Preview), then redeploy."
    );
  }

  // HTTP driver (no WebSockets). The default PrismaNeon WS pool often breaks on Vercel
  // unless `ws` + neonConfig.webSocketConstructor are wired; HTTP is simpler for serverless.
  const adapter = new PrismaNeonHttp(dbUrl, {
    arrayMode: false,
    fullResults: false,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
