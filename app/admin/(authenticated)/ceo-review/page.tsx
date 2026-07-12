import { prisma } from "@/lib/prisma";
import CeoReviewClient from "./CeoReviewClient";

export const dynamic = "force-dynamic";

export default async function CeoReviewPage() {
  const applicants = await prisma.applicant.findMany({
    where: { status: "Passed" },
    include: {
      jobPosting: { select: { id: true, title: true, type: true } },
      interviewSession: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedApplicants = applicants.map((a: any) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    interviewSession: a.interviewSession ? {
      ...a.interviewSession,
      completedAt: a.interviewSession.completedAt?.toISOString() || null,
    } : null
  }));

  return <CeoReviewClient applicants={serializedApplicants} />;
}
