import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicantId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicantId } = await params;
  const { content, expiresInDays } = await req.json();

  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { jobPosting: true },
  });

  if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });

  // Check if offer already exists
  const existing = await prisma.offerLetter.findUnique({ where: { applicantId } });
  if (existing) return NextResponse.json({ error: "Offer letter already sent to this applicant" }, { status: 409 });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7));

  const offer = await prisma.offerLetter.create({
    data: {
      applicantId,
      jobPostingId: applicant.jobPostingId,
      content,
      token,
      expiresAt,
      status: "Sent",
    },
  });

  // Update applicant status
  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: "Offer" },
  });

  // Log
  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: "OFFER_SENT",
      metadata: JSON.stringify({ applicantId, applicantName: applicant.fullName, token }),
    },
  });

  const offerUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://cyberlabsec.tech"}/offers/${token}`;

  return NextResponse.json({ success: true, offer, offerUrl });
}
