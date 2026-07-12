import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

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

  // Notifications
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
    
    await prisma.applicant.update({
      where: { id: applicant.id },
      data: { status: "Hired" }
    });

    const year = new Date().getFullYear();
    const code = `CL-${year}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const defaultPassword = crypto.randomBytes(4).toString("hex");

    const employee = await prisma.employee.create({
      data: {
        email: applicant.email,
        name: applicant.fullName,
        designation: "New Hire",
        employeeCode: code,
        status: "Active",
        startDate: new Date(),
        employmentType: "Intern",
        passwordHash: defaultPassword, // Replace with proper hashing
      }
    });

    const emailHtml = `
      <h2>Welcome to CyberLabSec, ${applicant.fullName}!</h2>
      <p>We are thrilled to offer you a position. Please find your offer letter attached.</p>
      ${customMessage ? `<blockquote>${customMessage}</blockquote>` : ""}
      <p><strong>Employee Code:</strong> ${code}</p>
      <p><strong>Temporary Password:</strong> ${defaultPassword}</p>
      <p>Login at: <a href="https://cyberlabsec.tech/employee/login">https://cyberlabsec.tech/employee/login</a></p>
    `;

    try {
      await sendEmail({
        to: applicant.email,
        subject: "Welcome to CyberLabSec - Offer Letter enclosed",
        html: emailHtml,
        attachments: offerLetterFileBase64 ? [
          { filename: "CyberLabSec_Offer_Letter.pdf", content: offerLetterFileBase64, encoding: "base64" }
        ] : undefined
      });
    } catch (e) {
      console.error("Failed to send hire email:", e);
    }
  }

  return NextResponse.json({ success: true });
}
