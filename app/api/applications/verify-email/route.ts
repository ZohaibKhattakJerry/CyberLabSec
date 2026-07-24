import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getIpFromRequest, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`verify-email-ip:${ip}`, 10, 15);
  if (blocked) return rateLimitResponse(resetAt);

  try {
    const { email, code } = await bodyParse(req);
    if (!email || !code) return NextResponse.json({ error: "Email and code required" }, { status: 400 });

    const verification = await prisma.emailVerification.findFirst({
      where: { email, otp: code, verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (error: any) {
    console.error("Failed to verify OTP:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

async function bodyParse(req: Request) {
  const text = await req.text();
  try { return JSON.parse(text); } catch { return {}; }
}
