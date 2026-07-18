// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getAuthFromCookies } from "@/lib/auth";
import { list } from "@vercel/blob";
import archiver from "archiver";
import { PassThrough, Readable } from "stream";
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
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const archive = archiver("zip", { zlib: { level: 5 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    if (encryptBackup) {
      const encryptedPayload = encrypt(plainJson, password);
      const wrapper = JSON.stringify({ v: "3.0", enc: true, payload: encryptedPayload });
      archive.append(wrapper, { name: `cyberlabsec-${date}.clsbackup` });
    } else {
      archive.append(plainJson, { name: `cyberlabsec-${date}.json` });
    }

    // Try to fetch all files from Vercel Blob
    try {
      const { blobs } = await list();
      for (const blob of blobs) {
        try {
          const res = await fetch(blob.url);
          if (res.ok && res.body) {
            const nodeStream = Readable.fromWeb(res.body as any);
            archive.append(nodeStream, { name: `uploads/${blob.pathname}` });
          }
        } catch (e) {
          console.error("Failed to fetch blob for backup", blob.url);
        }
      }
    } catch (e) {
      console.error("Failed to list blobs", e);
    }

    archive.finalize();

    // Stream the ZIP response using Web Streams
    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => controller.enqueue(chunk));
        passThrough.on("end", () => controller.close());
        passThrough.on("error", (err) => controller.error(err));
      },
      cancel() {
        passThrough.destroy();
      }
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="cyberlabsec-full-backup-${date}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup generation failed." }, { status: 500 });
  }
}
