// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getAuthFromCookies } from "@/lib/auth";
const AdmZip = require("adm-zip");

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function decrypt(encryptedText: string, password: string): string {
  const [saltHex, ivHex, encrypted] = encryptedText.split(":");
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function wipeDatabase() {
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
  await prisma.cEOReview.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.task.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.offerLetter.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.team.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.talentPool.deleteMany();
  await prisma.policyDocument.deleteMany();
}

function safeDate(val: any) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

async function insertAll(data: any) {
  const d = data;

  if (d.policyDocuments?.length) for (const r of d.policyDocuments) { try { await prisma.policyDocument.create({ data: { id: r.id, title: r.title, body: r.body, version: r.version ?? 1, createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.teams?.length) for (const r of d.teams) { try { await prisma.team.create({ data: { id: r.id, name: r.name, leadEmployeeId: r.leadEmployeeId ?? null, createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.jobPostings?.length) for (const r of d.jobPostings) { try { await prisma.jobPosting.create({ data: { ...r, deadline: safeDate(r.deadline) ?? new Date(), publishedDate: safeDate(r.publishedDate), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.applicants?.length) for (const r of d.applicants) { try { await prisma.applicant.create({ data: { ...r, createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.interviewSessions?.length) for (const r of d.interviewSessions) { try { await prisma.interviewSession.create({ data: { ...r, tokenExpiry: safeDate(r.tokenExpiry) ?? new Date(), startedAt: safeDate(r.startedAt), completedAt: safeDate(r.completedAt), createdAt: safeDate(r.createdAt) ?? new Date() } }); } catch {} }

  if (d.offerLetters?.length) for (const r of d.offerLetters) { try { await prisma.offerLetter.create({ data: { ...r, expiresAt: safeDate(r.expiresAt) ?? new Date(), viewedAt: safeDate(r.viewedAt), acceptedAt: safeDate(r.acceptedAt), declinedAt: safeDate(r.declinedAt), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.employees?.length) for (const r of d.employees) { try { await prisma.employee.create({ data: { ...r, startDate: safeDate(r.startDate) ?? new Date(), endDate: safeDate(r.endDate), policyAcknowledgedAt: safeDate(r.policyAcknowledgedAt), offboardedAt: safeDate(r.offboardedAt), resetTokenExpiry: safeDate(r.resetTokenExpiry), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.tasks?.length) for (const r of d.tasks) { try { await prisma.task.create({ data: { ...r, deadline: safeDate(r.deadline) ?? new Date(), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.taskSubmissions?.length) for (const r of d.taskSubmissions) { try { await prisma.taskSubmission.create({ data: { ...r, submittedAt: safeDate(r.submittedAt) ?? new Date(), reviewedAt: safeDate(r.reviewedAt) } }); } catch {} }

  if (d.announcements?.length) for (const r of d.announcements) { try { await prisma.announcement.create({ data: { ...r, sentAt: safeDate(r.sentAt) ?? new Date(), expiresAt: safeDate(r.expiresAt) } }); } catch {} }

  if (d.announcementReadReceipts?.length) for (const r of d.announcementReadReceipts) { try { await prisma.announcementReadReceipt.create({ data: { id: r.id, announcementId: r.announcementId, employeeId: r.employeeId, readAt: safeDate(r.readAt) ?? new Date() } }); } catch {} }

  if (d.badges?.length) for (const r of d.badges) { try { await prisma.badge.create({ data: { id: r.id, employeeId: r.employeeId, type: r.type, label: r.label, awardedAt: safeDate(r.awardedAt) ?? new Date() } }); } catch {} }

  if (d.pointTransactions?.length) for (const r of d.pointTransactions) { try { await prisma.pointTransaction.create({ data: { id: r.id, employeeId: r.employeeId, taskId: r.taskId ?? null, points: r.points, reason: r.reason, adjustedBy: r.adjustedBy ?? null, createdAt: safeDate(r.createdAt) ?? new Date() } }); } catch {} }

  if (d.ceoReviews?.length) for (const r of d.ceoReviews) { try { await prisma.cEOReview.create({ data: { ...r, createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.teamMessages?.length) for (const r of d.teamMessages) { try { await prisma.teamMessage.create({ data: { ...r, createdAt: safeDate(r.createdAt) ?? new Date() } }); } catch {} }

  if (d.supportTickets?.length) for (const r of d.supportTickets) { try { await prisma.supportTicket.create({ data: { ...r, respondedAt: safeDate(r.respondedAt), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.attendanceRecords?.length) for (const r of d.attendanceRecords) { try { await prisma.attendanceRecord.create({ data: { ...r, date: safeDate(r.date) ?? new Date(), loginTime: safeDate(r.loginTime) ?? new Date(), logoutTime: safeDate(r.logoutTime), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.leaveRequests?.length) for (const r of d.leaveRequests) { try { await prisma.leaveRequest.create({ data: { ...r, startDate: safeDate(r.startDate) ?? new Date(), endDate: safeDate(r.endDate) ?? new Date(), reviewedAt: safeDate(r.reviewedAt), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.meetingRequests?.length) for (const r of d.meetingRequests) { try { await prisma.meetingRequest.create({ data: { ...r, confirmedTime: safeDate(r.confirmedTime), createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.performanceAppraisals?.length) for (const r of d.performanceAppraisals) { try { await prisma.performanceAppraisal.create({ data: { ...r, createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.activityLogs?.length) for (const r of d.activityLogs) { try { await prisma.activityLog.create({ data: { ...r, timestamp: safeDate(r.timestamp) ?? new Date() } }); } catch {} }

  if (d.employeeDocuments?.length) for (const r of d.employeeDocuments) { try { await prisma.employeeDocument.create({ data: { ...r, createdAt: safeDate(r.createdAt) ?? new Date(), updatedAt: safeDate(r.updatedAt) ?? new Date() } }); } catch {} }

  if (d.notifications?.length) for (const r of d.notifications) { try { await prisma.notification.create({ data: { ...r, createdAt: safeDate(r.createdAt) ?? new Date() } }); } catch {} }

  if (d.talentPool?.length) for (const r of d.talentPool) { try { await prisma.talentPool.create({ data: { id: r.id, email: r.email, createdAt: safeDate(r.createdAt) ?? new Date() } }); } catch {} }
}
export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies("admin");
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("backupFile") as File;
    const otp = formData.get("otp") as string;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

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

    const systemSecret = process.env.JWT_SECRET || "CyberLabSec@2024";
    const legacyPassword = "CyberLabSec@2024";

    let fileContent = "";
    if (file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      const backupEntry = zipEntries.find(e => e.entryName.endsWith(".clsbackup") || e.entryName.endsWith(".json"));
      if (!backupEntry) {
        return NextResponse.json({ error: "No valid backup file found inside ZIP" }, { status: 400 });
      }
      fileContent = backupEntry.getData().toString("utf8");
    } else {
      fileContent = await file.text();
    }

    let parsedData: any;

    // Try to detect if it's encrypted (.clsbackup) or plain JSON
    try {
      const wrapper = JSON.parse(fileContent);
      if (wrapper.enc === true && wrapper.payload) {
        // Encrypted backup — decrypt first with system secret
        try {
          const decrypted = decrypt(wrapper.payload, systemSecret);
          parsedData = JSON.parse(decrypted);
        } catch (secretError) {
          // Fallback to legacy password
          const decrypted = decrypt(wrapper.payload, legacyPassword);
          parsedData = JSON.parse(decrypted);
        }
      } else if (wrapper.data) {
        // Plain JSON backup
        parsedData = wrapper;
      } else {
        throw new Error("Unrecognized format");
      }
    } catch (decryptError) {
      return NextResponse.json({ error: "Failed to decrypt backup. File corrupted or unrecognized encryption." }, { status: 400 });
    }

    if (!parsedData?.data) {
      return NextResponse.json({ error: "Invalid backup file structure." }, { status: 400 });
    }

    // Wipe then restore
    await wipeDatabase();
    await insertAll(parsedData.data);

    const totalRestored = Object.values(parsedData.data).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    return NextResponse.json({ 
      success: true, 
      message: `Database fully wiped and restored! ${totalRestored} total records recovered.`,
      counts: parsedData.counts ?? {}
    });
  } catch (error: any) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: "Restore failed. Please check file and password." }, { status: 500 });
  }
}
