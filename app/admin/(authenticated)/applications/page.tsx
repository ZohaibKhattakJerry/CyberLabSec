import { prisma } from "@/lib/prisma";
import ApplicationsClient from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const postings = await prisma.jobPosting.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const applicants = await prisma.applicant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      jobPosting: { select: { id: true, title: true, type: true } },
      interviewSession: { select: { id: true, totalScore: true, result: true, completedAt: true } },
    },
  });

  const serialized = applicants.map((a: any) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    jobPosting: a.jobPosting,
    interviewSession: a.interviewSession ? {
      ...a.interviewSession,
      completedAt: a.interviewSession.completedAt?.toISOString() ?? null,
    } : null,
  }));

  return <ApplicationsClient applicants={serialized} postings={postings} />;
}
