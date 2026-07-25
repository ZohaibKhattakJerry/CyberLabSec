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
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { 
        attempts: session.attempts + 1,
        startedAt: session.startedAt || new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
