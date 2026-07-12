import { prisma } from "@/lib/prisma";
import FinalApprovalClient from "./FinalApprovalClient";

export const dynamic = "force-dynamic";

export default async function FinalApprovalPage() {
  const reviews = await prisma.cEOReview.findMany({
    where: { status: "Pending" },
    include: {
      submitter: { select: { name: true, designation: true } },
      applicant: {
        include: {
          jobPosting: { select: { id: true, title: true, type: true } },
          interviewSession: true,
        },
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedReviews = reviews.map((r: any) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    applicant: r.applicant ? {
      ...r.applicant,
      createdAt: r.applicant.createdAt.toISOString(),
      interviewSession: r.applicant.interviewSession ? {
        ...r.applicant.interviewSession,
        completedAt: r.applicant.interviewSession.completedAt?.toISOString() || null,
      } : null
    } : null
  }));

  return <FinalApprovalClient reviews={serializedReviews} />;
}
