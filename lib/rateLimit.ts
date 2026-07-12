import { NextResponse } from "next/server";
import { prisma } from "./prisma";

/**
 * Rate limit by key (IP address or other identifier)
 * Returns true if the action should be BLOCKED (rate limit exceeded)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ blocked: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowMs = windowMinutes * 60 * 1000;

  let record = await prisma.rateLimit.findUnique({ where: { key } });

  if (!record || record.resetAt < now) {
    // Create or reset
    record = await prisma.rateLimit.upsert({
      where: { key },
      update: { attempts: 1, resetAt: new Date(now.getTime() + windowMs) },
      create: {
        key,
        attempts: 1,
        resetAt: new Date(now.getTime() + windowMs),
      },
    });
    return { blocked: false, remaining: maxAttempts - 1, resetAt: record.resetAt };
  }

  if (record.attempts >= maxAttempts) {
    return { blocked: true, remaining: 0, resetAt: record.resetAt };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { attempts: record.attempts + 1 },
  });

  return {
    blocked: false,
    remaining: maxAttempts - record.attempts - 1,
    resetAt: record.resetAt,
  };
}

export function rateLimitResponse(resetAt: Date) {
  return NextResponse.json(
    {
      error: "Too many attempts. Please try again later.",
      resetAt: resetAt.toISOString(),
    },
    { status: 429 }
  );
}

export function getIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}
