import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { createPrismaClient } from "@/lib/create-prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  const isStale =
    cached &&
    (typeof (cached as PrismaClient & { sellerAnnouncement?: unknown }).sellerAnnouncement
      ?.findMany !== "function" ||
      typeof (cached as PrismaClient & { blog?: unknown }).blog?.findMany !== "function" ||
      typeof (cached as PrismaClient & { categoryRequest?: unknown }).categoryRequest
        ?.findMany !== "function" ||
      typeof (cached as PrismaClient & { sellerActivationRequest?: unknown }).sellerActivationRequest
        ?.findMany !== "function");

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
