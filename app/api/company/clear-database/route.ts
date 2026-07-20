import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

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
  await prisma.employee.deleteMany({ where: { employeeCode: { not: "CyberLabSec" } } });
  await prisma.team.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.talentPool.deleteMany();
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies("admin");
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const otp = body.otp;

    let config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
    let configData = config ? JSON.parse(config.data) : {};

    if (!otp || otp !== configData.currentOtp || Date.now() > (configData.otpExpiry || 0)) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Clear OTP after successful verification
    configData.currentOtp = null;
    configData.otpExpiry = 0;
    await prisma.adminConfig.update({
      where: { id: "singleton" },
      data: { data: JSON.stringify(configData) }
    });

    await wipeDatabase();

    return NextResponse.json({ success: true, message: "All database records have been permanently deleted." });
  } catch (error) {
    console.error("Database wipe failed:", error);
    return NextResponse.json({ error: "Failed to clear database." }, { status: 500 });
  }
}
