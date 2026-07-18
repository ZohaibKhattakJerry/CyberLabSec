// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AES-256-CBC Encryption
function encrypt(text: string, password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Format: salt(hex):iv(hex):encrypted(hex)
  return `${salt.toString("hex")}:${iv.toString("hex")}:${encrypted}`;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("company_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const password = searchParams.get("password") || "CyberLabSec@2024";
    const encryptBackup = searchParams.get("encrypt") !== "false";

    // ── Fetch ALL tables in parallel ──────────────────────────────────────────
    const [
      employees,
      teams,
      jobPostings,
      applicants,
      announcements,
      tasks,
      taskSubmissions,
      offerLetters,
      interviewSessions,
      activityLogs,
      employeeDocuments,
      badges,
      pointTransactions,
      announcementReadReceipts,
      ceoReviews,
      teamMessages,
      supportTickets,
      attendanceRecords,
      leaveRequests,
      meetingRequests,
      performanceAppraisals,
      policyDocuments,
      notifications,
      talentPool,
    ] = await Promise.all([
      prisma.employee.findMany(),
      prisma.team.findMany(),
      prisma.jobPosting.findMany(),
      prisma.applicant.findMany(),
      prisma.announcement.findMany(),
      prisma.task.findMany(),
      prisma.taskSubmission.findMany(),
      prisma.offerLetter.findMany(),
      prisma.interviewSession.findMany(),
      prisma.activityLog.findMany(),
      prisma.employeeDocument.findMany(),
      prisma.badge.findMany(),
      prisma.pointTransaction.findMany(),
      prisma.announcementReadReceipt.findMany(),
      prisma.cEOReview.findMany(),
      prisma.teamMessage.findMany(),
      prisma.supportTicket.findMany(),
      prisma.attendanceRecord.findMany(),
      prisma.leaveRequest.findMany(),
      prisma.meetingRequest.findMany(),
      prisma.performanceAppraisal.findMany(),
      prisma.policyDocument.findMany(),
      prisma.notification.findMany(),
      prisma.talentPool.findMany(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "3.0",
      organization: "CyberLabSec",
      encrypted: encryptBackup,
      counts: {
        employees: employees.length,
        teams: teams.length,
        jobPostings: jobPostings.length,
        applicants: applicants.length,
        announcements: announcements.length,
        tasks: tasks.length,
        taskSubmissions: taskSubmissions.length,
        offerLetters: offerLetters.length,
        interviewSessions: interviewSessions.length,
        activityLogs: activityLogs.length,
        employeeDocuments: employeeDocuments.length,
        badges: badges.length,
        pointTransactions: pointTransactions.length,
        announcementReadReceipts: announcementReadReceipts.length,
        ceoReviews: ceoReviews.length,
        teamMessages: teamMessages.length,
        supportTickets: supportTickets.length,
        attendanceRecords: attendanceRecords.length,
        leaveRequests: leaveRequests.length,
        meetingRequests: meetingRequests.length,
        performanceAppraisals: performanceAppraisals.length,
        policyDocuments: policyDocuments.length,
        notifications: notifications.length,
        talentPool: talentPool.length,
      },
      data: {
        employees,
        teams,
        jobPostings,
        applicants,
        announcements,
        tasks,
        taskSubmissions,
        offerLetters,
        interviewSessions,
        activityLogs,
        employeeDocuments,
        badges,
        pointTransactions,
        announcementReadReceipts,
        ceoReviews,
        teamMessages,
        supportTickets,
        attendanceRecords,
        leaveRequests,
        meetingRequests,
        performanceAppraisals,
        policyDocuments,
        notifications,
        talentPool,
      },
    };

    const plainJson = JSON.stringify(backup);
    const date = new Date().toISOString().split("T")[0];

    if (encryptBackup) {
      // Encrypt and return as .clsbackup binary-like file
      const encryptedPayload = encrypt(plainJson, password);
      const wrapper = JSON.stringify({ v: "3.0", enc: true, payload: encryptedPayload });
      return new NextResponse(wrapper, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="cyberlabsec-${date}.clsbackup"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Plain JSON (for debugging only)
    return new NextResponse(plainJson, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cyberlabsec-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup generation failed." }, { status: 500 });
  }
}
