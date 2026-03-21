import { PrismaClient } from "@prisma/client";

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
  // During build phase, don't instantiate PrismaClient
  if (process.env.NEXT_PHASE === "phase-production-build" || !process.env.DATABASE_URL) {
    return createDummyProxy();
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
