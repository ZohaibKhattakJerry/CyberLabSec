import { prisma } from "@/lib/prisma";
import ApplicationsClient from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const postings = await prisma.jobPosting.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const applicants = await prisma.applicant.findMany({
    take: 300,
    orderBy: { createdAt: "desc" },
    include: {
      jobPosting: { select: { id: true, title: true, type: true } },
      interviewSession: { select: { id: true, totalScore: true, result: true, startedAt: true, completedAt: true, cheatingSignals: true, integrityViolations: true } },
      employeeRecord: { select: { status: true } },
    },
  });

  const serialized = applicants.map((a: any) => {
    // Exclude large base64 strings from the initial payload to prevent Next.js page data size crashes
    const { cvFileUrl, photoUrl, ...rest } = a;
    return {
      ...rest,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      jobPosting: a.jobPosting,
      employeeRecord: a.employeeRecord || null,
      interviewSession: a.interviewSession ? {
        ...a.interviewSession,
        startedAt: a.interviewSession.startedAt?.toISOString() ?? null,
        completedAt: a.interviewSession.completedAt?.toISOString() ?? null,
      } : null,
    };
  });

  return <ApplicationsClient applicants={serialized} postings={postings} />;
}
