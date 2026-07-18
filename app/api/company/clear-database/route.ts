import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function wipeDatabase() {
  // Delete in reverse dependency order to avoid FK constraint errors
  await prisma.announcementReadReceipt.deleteMany();
  await prisma.taskSubmission.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.meetingRequest.deleteMany();
  await prisma.performanceAppraisal.deleteMany();
  await prisma.teamMessage.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.task.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.cEOReview.deleteMany();
  await prisma.offerLetter.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.team.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.talentPool.deleteMany();
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("company_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await wipeDatabase();

    return NextResponse.json({ success: true, message: "All database records have been permanently deleted." });
  } catch (error) {
    console.error("Database wipe failed:", error);
    return NextResponse.json({ error: "Failed to clear database." }, { status: 500 });
  }
}
