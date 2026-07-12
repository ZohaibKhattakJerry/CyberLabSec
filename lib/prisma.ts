import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL;

  if (url?.startsWith("prisma://")) {
    return new PrismaClient({
      accelerateUrl: url,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // Use pg adapter for standard postgres:// URLs or as a dummy fallback to prevent build crashes
  const pool = new Pool({ connectionString: url || "postgres://dummy:dummy@localhost:5432/dummy" });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
