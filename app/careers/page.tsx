import { prisma } from "@/lib/prisma";
import _Link from "next/link";
import { Metadata } from "next";
import CareersJobBoard from "./CareersJobBoard";

export const metadata: Metadata = {
  title: "Careers at CyberLabSec",
  description: "Join CyberLab's offensive security team. Open positions in penetration testing, red teaming, and security research.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  try {
    const postings = await prisma.jobPosting.findMany({
      where: { status: "Published" },
      orderBy: { createdAt: "desc" },
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
      },
    });

    const serialized = postings.map((p) => ({
      ...p,
      deadline: p.deadline.toISOString(),
      publishedDate: p.publishedDate ? p.publishedDate.toISOString() : new Date().toISOString(),
    }));

    return <CareersJobBoard postings={serialized} />;
  } catch (error: unknown) {
    console.error("Failed to load postings:", error);
    return <CareersJobBoard postings={[]} />;
  }
}
