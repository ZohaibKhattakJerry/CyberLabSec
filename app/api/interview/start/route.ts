import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 404 });
    }

    if (session.attempts >= session.maxAttempts) {
      return NextResponse.json({ error: "Max attempts reached" }, { status: 403 });
    }

    // Increment attempt count on start. This consumes 1 attempt instantly.
    // So if the user refreshes or closes the page without submitting, they lose that attempt.
    // Prevent double-click attempt consumption within 10 seconds of startedAt
    const now = new Date();
    const lastStarted = session.startedAt ? new Date(session.startedAt) : null;
    const recentlyStarted = lastStarted && (now.getTime() - lastStarted.getTime()) < 10000;
    
    const newAttempts = recentlyStarted ? session.attempts : session.attempts + 1;

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { 
        attempts: newAttempts,
        startedAt: session.startedAt || now
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
