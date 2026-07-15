import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

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

  await sendEmail({
    to: applicant.email,
    subject: `Congratulations! Job Offer from CyberLabSec`,
    html: `
      <div>
        <h2 style="font-size: 26px; font-weight: 800; color: #f4f4f5; margin: 0 0 16px 0;">You've Got an Offer! 🎉</h2>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Hi ${applicant.fullName.split(" ")[0]},</p>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">We are thrilled to officially extend an offer for the <strong style="color: #f4f4f5;">${applicant.jobPosting.title}</strong> role at CyberLabSec.</p>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">Your hard work, exceptional skills, and performance during the interview process have truly impressed our team.</p>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${offerUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); color: #ffffff !important; text-decoration: none !important; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.01em; box-shadow: 0 4px 20px rgba(168,85,247,0.35);">View & Respond to Offer →</a>
        </div>
        
        <div style="background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 16px 20px; margin: 24px 0;">
          <p style="color: #f4f4f5; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">Offer Expiration Notice</p>
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">This offer requires your response within <strong style="color: #f59e0b;">${expiresInDays || 7} days</strong>.</p>
        </div>
      </div>
    `
  }).catch(e => console.error("Failed to send offer email:", e));

  return NextResponse.json({ success: true, offer, offerUrl });
}
