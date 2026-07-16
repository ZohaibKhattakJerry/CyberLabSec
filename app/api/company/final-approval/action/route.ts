import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmployeeCredentials, sendDeclineEmail } from "@/lib/email";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reviewId, status, customMessage, offerLetterFileBase64 } = await req.json();

  const review = await prisma.cEOReview.findUnique({
    where: { id: reviewId },
    include: { applicant: true, submitter: true }
  });

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  await prisma.cEOReview.update({
    where: { id: reviewId },
    data: { status, comments: customMessage || review.comments }
  });

  // Notify the submitter
  await prisma.notification.create({
    data: {
      userId: review.submitterId,
      title: `CEO Review ${status}`,
      message: `Your request for ${review.applicant ? review.applicant.fullName : 'general review'} was ${status.toLowerCase()}.`,
      type: "CEOReview",
      link: "/company/final-approval"
    }
  });

  if (status === "Approved" && review.type === "Hire Request" && review.applicantId) {
    const applicant = review.applicant!;

    // Check if employee already exists to avoid duplicates
    const existingEmployee = await prisma.employee.findUnique({ where: { applicantId: applicant.id } });
    if (!existingEmployee) {
      // Update applicant status
      await prisma.applicant.update({
        where: { id: applicant.id },
        data: { status: "Hired" }
      });

      const year = new Date().getFullYear();
      const code = `CL-${year}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      const rawPassword = crypto.randomBytes(4).toString("hex");
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const employee = await prisma.employee.create({
        data: {
          email: applicant.email,
          name: applicant.fullName,
          designation: "New Hire",
          employeeCode: code,
          status: "Active",
          startDate: new Date(),
          employmentType: "Intern",
          passwordHash,
          mustResetPassword: true,
          applicantId: applicant.id,
        }
      });

      await prisma.activityLog.create({
        data: {
          actorId: auth.sub,
          actorType: "Admin",
          action: "EMPLOYEE_HIRED",
          metadata: JSON.stringify({ employeeId: employee.id, applicantId: applicant.id, employeeCode: code })
        }
      }).catch(() => {});

      if (offerLetterFileBase64) {
        await prisma.employeeDocument.create({
          data: {
            employeeId: employee.id,
            title: "Offer Letter",
            type: "Offer Letter",
            fileUrl: `data:application/pdf;base64,${offerLetterFileBase64}`,
            status: "Approved",
            uploadedBy: auth.sub
          }
        }).catch(() => {});
      }

      const portalUrl = "https://cyberlabsec.tech/employee/login";
      try {
        await sendEmployeeCredentials(
          applicant.email,
          applicant.fullName,
          code,
          rawPassword,
          portalUrl,
          offerLetterFileBase64 || undefined,
          customMessage || undefined
        );
      } catch (e) {
        console.error("Failed to send hire email:", e);
        return NextResponse.json({ error: "Applicant hired, but email failed to send. They can reset their password manually." }, { status: 500 });
      }
    }
  } else if (status === "Rejected" && review.type === "Hire Request" && review.applicant) {
    // Move applicant to Rejected stage
    await prisma.applicant.update({
      where: { id: review.applicant.id },
      data: { status: "Rejected" }
    }).catch(() => {});

    sendDeclineEmail(
      review.applicant.email,
      review.applicant.fullName,
      review.applicant.jobPosting?.title || "Role"
    ).catch(e => {
      console.error("Failed to send rejection email:", e);
    });
  }

  return NextResponse.json({ success: true });
}
