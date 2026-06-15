import { PrismaClient } from "@prisma/client";

/**
 * Singleton-PrismaClient. In Dev verhindert global-Caching mehrfache
 * Instanzen bei HMR. Re-export aller generierten Typen für Backend-Nutzung.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
