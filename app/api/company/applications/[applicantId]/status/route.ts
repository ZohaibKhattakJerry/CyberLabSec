import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicantId } = await params;
  const { status } = await req.json();

  const validStatuses = ["Applied","Reviewing","Shortlisted","InterviewInvited","Needs Retry","Passed","Failed","Rejected","Hired","Blocked","Final Approval","Offer","Withdrawn"];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
    include: { jobPosting: true, interviewSession: { select: { token: true } } }
  });

  if (status !== "Applied" && status !== "Hired") {
    await sendEmail({
      to: updated.email,
      subject: `Update on your application for ${updated.jobPosting.title}`,
      html: `
        <div>
          <h2 style="font-size: 24px; font-weight: 800; color: #09090b; margin: 0 0 16px 0;">Application Status Update</h2>
          <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Hi ${updated.fullName.split(" ")[0]},</p>
          <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Your application for <strong style="color: #09090b;">${updated.jobPosting.title}</strong> has moved to a new stage.</p>
          
          <div style="background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 20px 24px; margin: 24px 0;">
            <p style="color: #09090b; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Current Status</p>
            <p style="color: #3f3f46; font-size: 13px; margin: 0; line-height: 1.6;"><strong style="color: #a855f7;">${status}</strong></p>
          </div>
          
          <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0;">Our team is reviewing your profile and will be in touch with next steps soon.</p>
        </div>
      `
    }).catch(e => console.error("Failed to send status email:", e));
  }

  // Trigger templated emails based on new stage
  if (status === "Rejected") {
    const { sendDeclineEmail } = await import("@/lib/email");
    await sendDeclineEmail(updated.email, updated.fullName, updated.jobPosting.title).catch(console.error);
  }

  if (status === "Interview" && updated.interviewSession?.token) {
    const { sendInterviewInvite } = await import("@/lib/email");
    const interviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://cyberlabsec.tech"}/careers/interview/${updated.interviewSession.token}`;
    await sendInterviewInvite(
      updated.email,
      updated.fullName,
      updated.jobPosting.title,
      interviewLink,
      72 // 72-hour expiry
    ).catch(console.error);
  }

  // Log stage change
  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: "APPLICATION_STAGE_CHANGED",
      metadata: JSON.stringify({ applicantId, applicantName: updated.fullName, from: "unknown", to: status }),
    }
  }).catch(() => {});

  return NextResponse.json({ success: true, status: updated.status });
}
