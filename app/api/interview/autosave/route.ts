import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getIpFromRequest, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`interview-autosave-ip:${ip}`, 30, 1);
  if (blocked) return rateLimitResponse(resetAt);
  try {
    const { sessionId, answers } = await bodyParse(req);
    if (!sessionId || !answers) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Autosave failed:", error);
    return NextResponse.json({ error: "Failed to autosave" }, { status: 500 });
  }
}

async function bodyParse(req: Request) {
  const text = await req.text();
  try { return JSON.parse(text); } catch { return {}; }
}
