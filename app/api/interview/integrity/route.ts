import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, type, count } = await req.json();
    if (!sessionId || !type)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Parse existing integrity violations log
    let integrityLog: Array<{ type: string; count: number; timestamp: string }> = [];
    try {
      integrityLog = JSON.parse((session as any).integrityViolations || "[]");
    } catch {}

    integrityLog.push({ type, count, timestamp: new Date().toISOString() });

    // If 5+ tab switches, mark session as IntegrityTerminated via result field
    const isTerminated = count >= 5 && type === "tab_switch";

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        integrityViolations: JSON.stringify(integrityLog),
        ...(isTerminated ? { result: "IntegrityTerminated" } : {}),
      } as any,
    });

    return NextResponse.json({ success: true, isTerminated });
  } catch (error) {
    // Fallback: log to ActivityLog if session update fails
    try {
      const { sessionId, type, count } = await req.json().catch(() => ({
        sessionId: "unknown",
        type: "unknown",
        count: 0,
      }));
      await prisma.activityLog.create({
        data: {
          actorId: sessionId,
          actorType: "Candidate",
          action: `INTEGRITY_${String(type).toUpperCase()}`,
          metadata: JSON.stringify({ sessionId, type, count }),
        },
      });
    } catch {}
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
