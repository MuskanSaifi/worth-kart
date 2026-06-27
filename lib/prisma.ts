import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  // Dev hot-reload can keep a stale client after `prisma generate` / schema changes.
  const isStale =
    cached &&
    (typeof (cached as PrismaClient & { sellerAnnouncement?: unknown }).sellerAnnouncement
      ?.findMany !== "function" ||
      typeof (cached as PrismaClient & { categoryRequest?: unknown }).categoryRequest
        ?.findMany !== "function" ||
      typeof (cached as PrismaClient & { sellerActivationRequest?: unknown }).sellerActivationRequest
        ?.findMany !== "function" ||
      !("panVerified" in ((cached as PrismaClient & { sellerProfile?: { fields?: Record<string, unknown> } }).sellerProfile?.fields ?? {})));

  if (cached && !isStale) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
