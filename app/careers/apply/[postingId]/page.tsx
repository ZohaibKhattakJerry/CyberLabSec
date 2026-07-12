import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ApplicationForm from "./ApplicationForm";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ postingId: string }>;
}) {
  const { postingId } = await params;
  
  const posting = await prisma.jobPosting.findUnique({
    where: { id: postingId, status: "Open" },
    select: {
      id: true,
      title: true,
      type: true,
      department: true,
      location: true,
      description: true,
      requirements: true,
      universityRequired: true,
      deadline: true,
    },
  });

  if (!posting) notFound();

  const now = new Date();
  if (posting.deadline < now) notFound();

  return (
    <ApplicationForm
      posting={{
        ...posting,
        deadline: posting.deadline.toISOString(),
      }}
    />
  );
}
