import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ApplicationForm from "./ApplicationForm";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ postingId: string }> }): Promise<Metadata> {
  const { postingId } = await params;
  const posting = await prisma.jobPosting.findUnique({ where: { id: postingId } });
  
  if (!posting) return { title: "Not Found" };
  
  return {
    title: `Apply: ${posting.title} - CyberLabSec`,
    description: posting.description.substring(0, 150) + "...",
  };
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ postingId: string }>;
}) {
  const { postingId } = await params;
  
  let posting;
  try {
    posting = await prisma.jobPosting.findUnique({
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
      },
    });
  } catch (error: any) {
    console.error("Failed to load posting for application:", error);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card" style={{ maxWidth: 480, width: "100%", padding: 40, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--red)" }}>Service Unavailable</h1>
          <p style={{ color: "var(--text-secondary)" }}>We are currently unable to process applications. Please check back later.</p>
        </div>
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
