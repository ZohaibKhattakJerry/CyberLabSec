import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import CareersJobBoard from "./CareersJobBoard";

export const metadata: Metadata = {
  title: "Careers at CyberLab",
  description: "Join CyberLab's offensive security team. Open positions in penetration testing, red teaming, and security research.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  try {
    const postings = await prisma.jobPosting.findMany({
      where: { status: "Open" },
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
        _count: { select: { applicants: true } },
      },
    });

    const serialized = postings.map((p) => ({
      ...p,
      deadline: p.deadline.toISOString(),
    }));

    return <CareersJobBoard postings={serialized} />;
  } catch (error: any) {
    console.error("Failed to load postings:", error);
    return <CareersJobBoard postings={[]} />;
  }
}
