import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicantId } = await params;
  const { status } = await req.json();

  const validStatuses = ["Reviewing", "Invited for Interview", "Interview Failed", "Selected – Waiting for Approval", "Hired", "Rejected"];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid target status" }, { status: 400 });

  const currentApplicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!currentApplicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });

  const currentStatus = currentApplicant.status;

  if (currentStatus === "Hired") {
    return NextResponse.json({ error: "Cannot modify status of a Hired applicant." }, { status: 400 });
  }
  
  if (currentStatus === "Interview Failed" && status !== "Interview Failed") {
    return NextResponse.json({ error: "Candidate has failed. Cannot change status." }, { status: 400 });
  }

  if (status === "Rejected" && ["Hired", "Interview Failed", "Rejected"].includes(currentStatus)) {
    return NextResponse.json({ error: "Invalid state transition to Rejected." }, { status: 400 });
  }

  if (status === "Hired") {
    return NextResponse.json({ error: "Please use the official Hire workflow to transition to Hired." }, { status: 400 });
  }

  const updated = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
    include: { jobPosting: true, interviewSession: { select: { token: true } } }
  });

  // Trigger templated emails based on new stage
  if (status === "Rejected") {
    const { sendDeclineEmail } = await import("@/lib/email");
    await sendDeclineEmail(updated.email, updated.fullName, updated.jobPosting.title).catch(console.error);
  } else if (status === "Hired") {
    const { sendHiredEmail } = await import("@/lib/email");
    await sendHiredEmail(updated.email, updated.fullName, updated.jobPosting.title).catch(console.error);
  } else if (status === "Invited for Interview" && updated.interviewSession?.token) {
    const { sendInterviewInvite } = await import("@/lib/email");
    const interviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://cyberlabsec.tech"}/careers/interview/${updated.interviewSession.token}`;
    await sendInterviewInvite(
      updated.email,
      updated.fullName,
      updated.jobPosting.title,
      interviewLink,
      168 // 7-day expiry
    ).catch(console.error);
  }

  // Log stage change
  await prisma.activityLog.create({
    data: {
      actorId: null,
      actorType: "Admin",
      action: "APPLICATION_STAGE_CHANGED",
      metadata: JSON.stringify({ applicantId, applicantName: updated.fullName, from: "unknown", to: status }),
    }
  }).catch(() => {});

  return NextResponse.json({ success: true, status: updated.status });
}
