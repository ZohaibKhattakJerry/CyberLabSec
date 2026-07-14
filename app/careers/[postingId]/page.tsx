import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postingId: string }>;
}): Promise<Metadata> {
  const { postingId } = await params;
  const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
  if (!posting) return { title: "Not Found" };
  return {
    title: `${posting.title} — Careers at CyberLabSec`,
    description: posting.description.substring(0, 160) + "…",
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ postingId: string }>;
}) {
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
      niceToHave: true,
      whatYouGain: true,
      stipend: true,
      duration: true,
      weeklyHours: true,
      experienceLevel: true,
      openings: true,
      universityRequired: true,
      deadline: true,
      showApplicantCount: true,
      publishedDate: true,
      createdAt: true,
      _count: { select: { applicants: true } },
    },
  });

  if (!posting) notFound();

  const serialized = {
    ...posting,
    deadline: posting.deadline.toISOString(),
    publishedDate: posting.publishedDate
      ? posting.publishedDate.toISOString()
      : posting.createdAt.toISOString(),
    createdAt: posting.createdAt.toISOString(),
  };

  // JSON-LD for Google Jobs SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: posting.title,
    description: posting.description,
    datePosted: serialized.publishedDate,
    validThrough: serialized.deadline,
    employmentType: posting.type === "Job" ? "FULL_TIME" : "INTERN",
    hiringOrganization: {
      "@type": "Organization",
      name: "CyberLabSec",
      sameAs: "https://cyberlabsec.tech",
      logo: "https://cyberlabsec.tech/logo.png",
    },
    jobLocation: {
      "@type": "Place",
      address: posting.location,
    },
    baseSalary: posting.stipend
      ? {
          "@type": "MonetaryAmount",
          currency: "PKR",
          value: { "@type": "QuantitativeValue", value: posting.stipend, unitText: "MONTH" },
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobDetailClient posting={serialized} />
    </>
  );
}
