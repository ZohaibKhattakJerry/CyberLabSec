import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Hide from Webpack static analysis
const getEnv = (name: string) => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
};

const createPrismaClient = () => {
  const connectionString = getEnv("DATABASE_URL") || getEnv("POSTGRES_URL");
  
  if (!connectionString) {
    console.error("CRITICAL ERROR: Database connection string is undefined at runtime!");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  
  return new PrismaClient({
    adapter,
    log:
      getEnv("NODE_ENV") === "development"
        ? ["error", "warn"]
        : ["error"],
  });
};

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});

if (getEnv("NODE_ENV") !== "production") globalForPrisma.prisma = prisma;
