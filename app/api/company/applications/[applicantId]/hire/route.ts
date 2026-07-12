import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { applicantId } = await params;

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
  });

  if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  
  const existingEmployee = await prisma.employee.findUnique({ where: { applicantId: applicant.id } });
  if (existingEmployee) return NextResponse.json({ error: "Employee record already exists" }, { status: 409 });

  // Create Final Approval request
  const review = await prisma.cEOReview.create({
    data: {
      type: "Hire Request",
      applicantId: applicant.id,
      submitterId: auth.sub,
      status: "Pending",
      comments: `Hire request for ${applicant.fullName}`,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub, actorType: "Admin", action: "HIRE_REQUEST_SUBMITTED",
      metadata: JSON.stringify({ reviewId: review.id, applicantId }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, reviewId: review.id });
}
