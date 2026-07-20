// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getAuthFromCookies } from "@/lib/auth";
import { list } from "@vercel/blob";
import { ZipArchive } from "archiver";
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
    const auth = await getAuthFromCookies("admin");
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const otp = searchParams.get("otp");
    const encryptBackup = searchParams.get("encrypt") !== "false";

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

    // Use server secret instead of user-provided password
    const password = process.env.JWT_SECRET || "CyberLabSec@2024";

    const passThrough = new PassThrough();
    const archive = new ZipArchive({ zlib: { level: 5 } });
    archive.pipe(passThrough);

    const generateBackup = async () => {
      try {
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
          const encryptedPayload = encrypt(plainJson, password);
          const wrapper = JSON.stringify({ v: "3.0", enc: true, payload: encryptedPayload });
          archive.append(wrapper, { name: `cyberlabsec-${date}.clsbackup` });
        } else {
          archive.append(plainJson, { name: `cyberlabsec-${date}.json` });
        }

        try {
          let hasMore = true;
          let cursor: string | undefined = undefined;
          
          while (hasMore) {
            const listResult = await list({ cursor });
            for (const blob of listResult.blobs) {
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
            hasMore = listResult.hasMore;
            cursor = listResult.cursor;
          }
        } catch (e) {
          console.error("Failed to list blobs", e);
        }

        await archive.finalize();
      } catch (err) {
        console.error("Backup stream generation failed", err);
        passThrough.destroy(err as Error);
      }
    };

    // Run archiving logic concurrently without awaiting
    generateBackup();

    const date = new Date().toISOString().split("T")[0];
    const webStream = Readable.toWeb(passThrough);

    return new NextResponse(webStream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="cyberlabsec-full-backup-${date}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Backup initialization failed:", error);
    return NextResponse.json({ error: "Backup generation failed. Details: " + error?.message + " | Stack: " + error?.stack }, { status: 500 });
  }
}
