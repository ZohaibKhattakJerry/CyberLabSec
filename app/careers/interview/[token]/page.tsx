import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InterviewClient from "./InterviewClient";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { applicant: { include: { jobPosting: true } } },
  });

  if (!session) notFound();

  // 1. Check if token is strictly expired by time (48 hours / 7 days)
  if (session.tokenExpiry < new Date()) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--purple)" }}>Link Expired</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            This interview link has expired. Interview links are valid for 48 hours and can only be used once.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 16 }}>If you believe this is an error, please contact us at careers@cyberlabsec.tech</p>
        </div>
      </div>
    );
  }

  // 2. If the applicant already passed, show them the Passed screen when they revisit
  if (session.result === "Passed" || session.applicant.status === "Selected – Waiting for Approval") {
    return (
      <InterviewClient
        sessionId={session.id}
        token={token}
        applicantName={session.applicant.fullName}
        applicantEmail={session.applicant.email}
        jobTitle={session.applicant.jobPosting.title}
        questions={[]}
        initialAnswers={{}}
        passMark={Number(session.applicant.jobPosting.passMark) || 0}
        emailVerified={true}
        attempts={session.attempts}
        maxAttempts={session.maxAttempts}
        initialPhaseOverride="done_passed"
      />
    );
  }

  // 3. If they already failed on 3rd attempt OR wasted all 3 attempts (session.attempts >= session.maxAttempts OR result === "Failed" OR result === "Cheating" OR tokenUsed)
  if (session.result === "Failed" || session.result === "Cheating" || session.attempts >= session.maxAttempts || session.tokenUsed) {
    if (session.result !== "Passed" && session.applicant.status === "Invited for Interview") {
      await prisma.applicant.update({
        where: { id: session.applicantId },
        data: { status: "Interview Failed" }
      });
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { result: "Failed", tokenUsed: true }
      });
    }

    return (
      <InterviewClient
        sessionId={session.id}
        token={token}
        applicantName={session.applicant.fullName}
        applicantEmail={session.applicant.email}
        jobTitle={session.applicant.jobPosting.title}
        questions={[]}
        initialAnswers={{}}
        passMark={Number(session.applicant.jobPosting.passMark) || 0}
        emailVerified={true}
        attempts={session.attempts}
        maxAttempts={session.maxAttempts}
        initialPhaseOverride="done_failed_final"
      />
    );
  }

  let questions: any[] = [];
  try {
    const parsedQ = JSON.parse(session.questions as string);
    if (Array.isArray(parsedQ)) questions = parsedQ;
  } catch {}

  let initialAnswers: Record<string, string> = {};
  try {
    const parsedA = JSON.parse(session.answers as string || "{}");
    if (typeof parsedA === "object" && !Array.isArray(parsedA)) initialAnswers = parsedA;
  } catch {}

  return (
    <InterviewClient
      sessionId={session.id}
      token={token}
      applicantName={session.applicant.fullName}
      applicantEmail={session.applicant.email}
      jobTitle={session.applicant.jobPosting.title}
      questions={questions}
      initialAnswers={initialAnswers}
      passMark={Number(session.applicant.jobPosting.passMark) || 0}
      emailVerified={session.emailVerified}
      attempts={session.attempts}
      maxAttempts={session.maxAttempts}
    />
  );
}
