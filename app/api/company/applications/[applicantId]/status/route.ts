import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import crypto from "crypto";

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

  const currentApplicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { interviewSession: { select: { token: true } }, jobPosting: true }
  });
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

  // ──────────────────────────────────────────────────────────────────────────
  // KEY FIX: When moving to "Invited for Interview", ensure an InterviewSession
  // exists. When autoShortlist=OFF, applicants skip the auto-session creation
  // during submission, so we create one here instead so the email has a link.
  // ──────────────────────────────────────────────────────────────────────────
  let interviewToken: string | null = currentApplicant.interviewSession?.token ?? null;

  if (status === "Invited for Interview" && !interviewToken) {
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Fetch questions from job posting assessment bank if available
      let questions: string[] = [];
      try {
        const bank = JSON.parse(currentApplicant.jobPosting.assessmentBank || "[]");
        if (Array.isArray(bank) && bank.length > 0) {
          questions = bank.slice(0, 10).map((q: any) => (typeof q === "string" ? q : q.question || q.text || String(q)));
        }
      } catch {}

      const session = await prisma.interviewSession.create({
        data: {
          applicantId,
          token,
          tokenExpiry,
          questions: JSON.stringify(questions),
          maxAttempts: 3,
        },
      });
      interviewToken = session.token;
    } catch (err) {
      console.error("Failed to create interview session for manual invite:", err);
      // Don't block the status update if session creation fails; just skip the link
    }
  }

  const updated = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status },
    include: { jobPosting: true }
  });

  // Trigger templated emails based on new stage
  if (status === "Rejected") {
    const { sendDeclineEmail } = await import("@/lib/email");
    await sendDeclineEmail(updated.email, updated.fullName, updated.jobPosting.title).catch(console.error);
  } else if (status === "Invited for Interview" && interviewToken) {
    const { sendInterviewInvite } = await import("@/lib/email");
    const interviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://cyberlabsec.tech"}/careers/interview/${interviewToken}`;
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
      metadata: JSON.stringify({ applicantId, applicantName: updated.fullName, from: currentStatus, to: status }),
    }
  }).catch(() => {});

  return NextResponse.json({ success: true, status: updated.status });
}
