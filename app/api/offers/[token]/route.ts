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

  // Mark as Viewed the first time candidate opens it
  if (offer.status === "Sent") {
    await prisma.offerLetter.update({
      where: { token },
      data: { status: "Viewed", viewedAt: new Date() },
    }).catch(() => {});
  }

  return NextResponse.json({ ...offer, status: offer.status === "Sent" ? "Viewed" : offer.status });
}
