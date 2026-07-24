import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Try to create or ignore if already exists (via unique constraint)
    try {
      await prisma.talentPool.create({
        data: { email }
      });
    } catch (e: any) {
      if (e.code !== 'P2002') { // Not a unique constraint error
        throw e;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Talent pool error:", error);
    return NextResponse.json({ error: "Failed to join talent pool" }, { status: 500 });
  }
}
