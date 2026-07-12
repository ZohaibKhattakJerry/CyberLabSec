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
  
  let posting;
  try {
    posting = await prisma.jobPosting.findUnique({
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
  } catch (error) {
    console.error("Failed to load posting for application:", error);
    return (
      <div className="p-10 text-center font-mono text-red-500">
        <h1 className="text-2xl font-bold mb-4">Service Unavailable</h1>
        <p className="text-gray-500">We are currently unable to process applications. Please check back later.</p>
      </div>
    );
  }

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
