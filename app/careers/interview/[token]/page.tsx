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

  // Token already used or expired
  if (session.tokenUsed || session.tokenExpiry < new Date()) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--purple)" }}>Link Expired</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            This interview link has already been used or has expired. Interview links are valid for 48 hours and can only be used once.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 16 }}>If you believe this is an error, please contact us at contact@cyberlabsec.tech</p>
        </div>
      </div>
    );
  }

  const questions = JSON.parse(session.questions as string);

  return (
    <InterviewClient
      sessionId={session.id}
      token={token}
      applicantName={session.applicant.fullName}
      applicantEmail={session.applicant.email}
      jobTitle={session.applicant.jobPosting.title}
      questions={questions}
      passMark={session.applicant.jobPosting.passMark}
      emailVerified={session.emailVerified}
    />
  );
}
