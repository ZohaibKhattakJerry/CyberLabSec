import { prisma } from "@/lib/prisma";
import PostingsClient from "./PostingsClient";

export const dynamic = "force-dynamic";

export default async function PostingsPage() {
  const postings = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applicants: true } } },
  });

  const serialized = postings.map((p: any) => ({
    ...p,
    deadline: p.deadline.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    effectiveDate: p.effectiveDate ? p.effectiveDate.toISOString() : null,
  }));

  return <PostingsClient postings={serialized} />;
}
