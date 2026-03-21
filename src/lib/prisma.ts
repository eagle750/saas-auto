import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws a helpful error only when actually used
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (typeof prop === "symbol" || prop === "then") return undefined;
        throw new Error(`DATABASE_URL is not set. Cannot access prisma.${String(prop)}`);
      },
    });
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
