import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const offer = await prisma.offerLetter.findUnique({
    where: { token },
    include: {
      applicant: { select: { fullName: true, email: true } },
      jobPosting: { select: { title: true } },
    },
  });

  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(offer);
}
