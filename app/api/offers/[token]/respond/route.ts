import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { action, signatureName, declineReason } = await req.json();

  const offer = await prisma.offerLetter.findUnique({
    where: { token },
    include: { applicant: true },
  });

  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.expiresAt < new Date()) return NextResponse.json({ error: "Offer has expired" }, { status: 410 });
  if (offer.status === "Accepted" || offer.status === "Declined") {
    return NextResponse.json({ error: "Offer has already been responded to" }, { status: 409 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  if (action === "accept") {
    if (!signatureName?.trim()) return NextResponse.json({ error: "Signature name is required" }, { status: 400 });

    await prisma.offerLetter.update({
      where: { token },
      data: {
        status: "Accepted",
        acceptedAt: new Date(),
        acceptedName: signatureName.trim(),
        acceptedIp: ip,
      },
    });

    // Update applicant status to Hired
    await prisma.applicant.update({
      where: { id: offer.applicantId },
      data: { status: "Hired" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        actorType: "Applicant",
        action: "OFFER_ACCEPTED",
        metadata: JSON.stringify({ offerId: offer.id, applicantName: offer.applicant.fullName, signatureName, ip }),
      },
    });

  } else if (action === "decline") {
    await prisma.offerLetter.update({
      where: { token },
      data: {
        status: "Declined",
        declinedAt: new Date(),
        declineReason: declineReason || null,
      },
    });

    await prisma.applicant.update({
      where: { id: offer.applicantId },
      data: { status: "Rejected" },
    });

    await prisma.activityLog.create({
      data: {
        actorType: "Applicant",
        action: "OFFER_DECLINED",
        metadata: JSON.stringify({ offerId: offer.id, applicantName: offer.applicant.fullName, declineReason }),
      },
    });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
