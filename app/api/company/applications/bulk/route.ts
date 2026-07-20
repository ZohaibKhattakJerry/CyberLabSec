import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, applicantIds } = await req.json();

  if (!action || !applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    if (action === "reject") {
      const applicants = await prisma.applicant.findMany({
        where: { id: { in: applicantIds } },
        include: { jobPosting: true },
      });

      const validApplicantsToReject = applicants.filter(
        a => !["Hired", "Interview Failed", "Rejected"].includes(a.status)
      );

      if (validApplicantsToReject.length === 0) {
        return NextResponse.json({ error: "None of the selected applicants can be rejected." }, { status: 400 });
      }

      const validIds = validApplicantsToReject.map(a => a.id);

      await prisma.applicant.updateMany({
        where: { id: { in: validIds } },
        data: { status: "Rejected" },
      });

      const applicantsToEmail = validApplicantsToReject;

      // Send rejection emails
      for (const app of applicantsToEmail) {
        if (app.status !== "Rejected") {
          const html = `
            <h2>Application Update</h2>
            <p>Dear ${app.fullName},</p>
            <p>Thank you for your interest in the <strong>${app.jobPosting.title}</strong> position at CyberLabSec. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
            <p>We appreciate the time you took to apply and wish you the best in your career journey.</p>
            <br/>
            <p>Best regards,<br/>The CyberLabSec Team</p>
          `;
          await sendEmail({ to: app.email, subject: `Update on your application for ${app.jobPosting.title}`, html });
        }
      }

      await prisma.activityLog.create({
        data: { actorId: null, actorType: "Admin", action: "BULK_REJECT", metadata: JSON.stringify({ count: applicantIds.length }) },
      }).catch(() => {});

      return NextResponse.json({ success: true });

    } else if (action === "delete") {
      // Validate none are Hired
      const applicantsToDelete = await prisma.applicant.findMany({
        where: { id: { in: applicantIds } },
        select: { id: true, status: true }
      });
      
      const hiredApplicants = applicantsToDelete.filter(a => a.status === "Hired");
      if (hiredApplicants.length > 0) {
        return NextResponse.json({ error: "Cannot delete Hired applicants. Please unselect them." }, { status: 400 });
      }

      // First delete associated interview sessions
      await prisma.interviewSession.deleteMany({
        where: { applicantId: { in: applicantIds } }
      });
      
      // Delete CEO/Final approvals
      await prisma.cEOReview.deleteMany({
        where: { applicantId: { in: applicantIds } }
      });

      // Delete Offer Letters
      await prisma.offerLetter.deleteMany({
        where: { applicantId: { in: applicantIds } }
      });

      // Unlink from employees if any (failsafe)
      await prisma.employee.updateMany({
        where: { applicantId: { in: applicantIds } },
        data: { applicantId: null }
      });

      // Delete applicants
      await prisma.applicant.deleteMany({
        where: { id: { in: applicantIds } },
      });

      await prisma.activityLog.create({
        data: { actorId: null, actorType: "Admin", action: "BULK_DELETE", metadata: JSON.stringify({ count: applicantIds.length }) },
      }).catch(() => {});

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Bulk action error:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
