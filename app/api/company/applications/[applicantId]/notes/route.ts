import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

/**
 * PATCH /api/company/applications/[applicantId]/notes
 * Saves the admin's internal rating (1–5 stars) and private notes
 * for a candidate. Both fields are optional — only provided fields are updated.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  // Auth guard — admin only
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Await params (Next.js 15 async params)
  const { applicantId } = await params;

  if (!applicantId) {
    return NextResponse.json({ error: "Missing applicantId" }, { status: 400 });
  }

  const { internalRating, privateNotes } = await req.json();

  // Validate rating range if provided
  if (
    internalRating !== undefined &&
    internalRating !== null &&
    (internalRating < 1 || internalRating > 5)
  ) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  // Verify the applicant exists
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { id: true },
  });

  if (!applicant) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  // Build the update payload — only include fields that were provided
  const updateData: Record<string, unknown> = {};
  if (internalRating !== undefined) updateData.internalRating = internalRating ?? null;
  if (privateNotes !== undefined) updateData.privateNotes = privateNotes;

  await prisma.applicant.update({
    where: { id: applicantId },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
