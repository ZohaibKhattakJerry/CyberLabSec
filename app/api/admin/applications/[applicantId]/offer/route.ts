import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ applicantId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ceoNotes } = await req.json();
  const resolvedParams = await params;

  const applicant = await prisma.applicant.findUnique({
    where: { id: resolvedParams.applicantId },
    include: { jobPosting: true },
  });

  if (!applicant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create an ActivityLog for the offer letter generation
  await prisma.activityLog.create({
    data: {
      actorType: "Admin",
      action: "OfferLetterGenerated",
      metadata: JSON.stringify({ 
        applicantId: applicant.id, 
        applicantName: applicant.fullName,
        jobTitle: applicant.jobPosting.title,
        notes: ceoNotes 
      }),
    },
  });

  // Mock URL for the offer letter view (we'll implement this as an API endpoint that returns HTML/PDF)
  const offerUrl = `/api/files/offer-letter/${applicant.id}?notes=${encodeURIComponent(ceoNotes || "")}`;

  return NextResponse.json({ success: true, url: offerUrl });
}
