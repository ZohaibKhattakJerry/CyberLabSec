import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ postingId: string }> }): Promise<Metadata> {
  const { postingId } = await params;
  const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
  
  if (!posting) return { title: "Not Found" };
  
  return {
    title: `${posting.title} - Careers at CyberLabSec`,
    description: posting.description.substring(0, 160) + "...",
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ postingId: string }> }) {
  const { postingId } = await params;
  
  const posting = await prisma.jobPosting.findUnique({
    where: { id: postingId, status: "Published" },
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
      showApplicantCount: true,
      publishedDate: true,
      _count: { select: { applicants: true } },
    }
  });

  if (!posting) notFound();

  const serialized = {
    ...posting,
    deadline: posting.deadline.toISOString(),
    publishedDate: posting.publishedDate ? posting.publishedDate.toISOString() : new Date().toISOString(),
  };

  return <JobDetailClient posting={serialized} />;
}
