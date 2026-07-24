import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/fileStorage";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  const auth = await getAuthFromCookies("admin");
  // Ensure the user is an admin/company user
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicantId } = await params;

  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { interviewSession: true, employeeRecord: true },
    });

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Delete associated files from local disk or blob
    if (applicant.cvFileUrl) await deleteFile(applicant.cvFileUrl);
    if (applicant.photoUrl) await deleteFile(applicant.photoUrl);

    // Delete the interview session if it exists
    if (applicant.interviewSession) {
      await prisma.interviewSession.delete({ where: { applicantId: applicant.id } });
    }

    // Delete CEOReviews if any exist
    await prisma.cEOReview.deleteMany({ where: { applicantId: applicant.id } });

    // Delete OfferLetter if it exists
    await prisma.offerLetter.deleteMany({ where: { applicantId: applicant.id } });

    // If an employee record was created from this applicant, unlink it
    if (applicant.employeeRecord) {
      await prisma.employee.update({
        where: { applicantId: applicant.id },
        data: { applicantId: null },
      });
    }

    // Finally, delete the applicant
    await prisma.applicant.delete({ where: { id: applicant.id } });

    return NextResponse.json({ success: true, message: "Applicant deleted successfully." });
  } catch (error: any) {
    console.error("Failed to delete applicant:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
