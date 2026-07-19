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
          const { HTML_START, WRAP_START, headerSection, BODY_START, heading1, paragraph, callout, BODY_END, footerSection, WRAP_END, HTML_END } = await import("@/lib/email");
          const firstName = updated.fullName.split(" ")[0];
          await sendEmail({
            to: updated.email,
            subject: `Update on your application for ${updated.jobPosting.title}`,
            html: `
              ${HTML_START}
              ${WRAP_START}
              ${headerSection("Application Status Update")}
              ${BODY_START}
                ${heading1(`Hi ${firstName},`)}
                ${paragraph(`Your application for <strong>${updated.jobPosting.title}</strong> has moved to a new stage.`)}
                
                ${callout("Current Status", `
                  <p style="margin: 0;"><strong style="color: #7c3aed; font-size: 16px;">${status}</strong></p>
                `, 'info')}
                
                ${paragraph(`Our team is reviewing your profile and will be in touch with next steps soon.`)}
              ${BODY_END}
              ${footerSection()}
              ${WRAP_END}
              ${HTML_END}
            `
          }).catch(e => console.error("Failed to send status email:", e));
  }

  // Trigger templated emails based on new stage
  if (status === "Rejected") {
    const { sendDeclineEmail } = await import("@/lib/email");
    await sendDeclineEmail(updated.email, updated.fullName, updated.jobPosting.title).catch(console.error);
  }

  if ((status === "Shortlisted" || status === "InterviewInvited") && updated.interviewSession?.token) {
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
