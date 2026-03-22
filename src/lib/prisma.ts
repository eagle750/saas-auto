import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Neon serverless driver needs a WebSocket implementation on Node (Vercel included).
neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

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

  // Use WebSocket pool (PrismaNeon), not PrismaNeonHttp: HTTP mode does not support
  // Prisma transactions, so writes like `project.create` fail with 500 while reads work.
  const adapter = new PrismaNeon({ connectionString: dbUrl });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
