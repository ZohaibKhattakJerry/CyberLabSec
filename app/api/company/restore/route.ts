import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

async function insertData(data: any) {
  const { teams, jobPostings, applicants, employees, announcements, tasks,
    taskSubmissions, offerLetters, interviewSessions, activityLogs, employeeDocuments } = data;

  // Insert in dependency order
  if (teams?.length) {
    for (const t of teams) {
      try { await prisma.team.create({ data: { ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) } }); } catch {}
    }
  }
  if (jobPostings?.length) {
    for (const j of jobPostings) {
      try { await prisma.jobPosting.create({ data: { ...j, deadline: new Date(j.deadline), createdAt: new Date(j.createdAt), updatedAt: new Date(j.updatedAt), publishedDate: j.publishedDate ? new Date(j.publishedDate) : null } }); } catch {}
    }
  }
  if (applicants?.length) {
    for (const a of applicants) {
      try { await prisma.applicant.create({ data: { ...a, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt) } }); } catch {}
    }
  }
  if (employees?.length) {
    for (const e of employees) {
      try {
        await prisma.employee.create({ data: { ...e, startDate: new Date(e.startDate), endDate: e.endDate ? new Date(e.endDate) : null, createdAt: new Date(e.createdAt), updatedAt: new Date(e.updatedAt), policyAcknowledgedAt: e.policyAcknowledgedAt ? new Date(e.policyAcknowledgedAt) : null, offboardedAt: e.offboardedAt ? new Date(e.offboardedAt) : null, resetTokenExpiry: e.resetTokenExpiry ? new Date(e.resetTokenExpiry) : null } });
      } catch {}
    }
  }
  if (tasks?.length) {
    for (const t of tasks) {
      try { await prisma.task.create({ data: { ...t, deadline: new Date(t.deadline), createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) } }); } catch {}
    }
  }
  if (taskSubmissions?.length) {
    for (const ts of taskSubmissions) {
      try { await prisma.taskSubmission.create({ data: { ...ts, submittedAt: new Date(ts.submittedAt), reviewedAt: ts.reviewedAt ? new Date(ts.reviewedAt) : null } }); } catch {}
    }
  }
  if (announcements?.length) {
    for (const a of announcements) {
      try { await prisma.announcement.create({ data: { ...a, sentAt: new Date(a.sentAt), expiresAt: a.expiresAt ? new Date(a.expiresAt) : null } }); } catch {}
    }
  }
  if (offerLetters?.length) {
    for (const ol of offerLetters) {
      try { await prisma.offerLetter.create({ data: { ...ol, expiresAt: new Date(ol.expiresAt), createdAt: new Date(ol.createdAt), updatedAt: new Date(ol.updatedAt), viewedAt: ol.viewedAt ? new Date(ol.viewedAt) : null, acceptedAt: ol.acceptedAt ? new Date(ol.acceptedAt) : null, declinedAt: ol.declinedAt ? new Date(ol.declinedAt) : null } }); } catch {}
    }
  }
  if (interviewSessions?.length) {
    for (const i of interviewSessions) {
      try { await prisma.interviewSession.create({ data: { ...i, tokenExpiry: new Date(i.tokenExpiry), createdAt: new Date(i.createdAt), startedAt: i.startedAt ? new Date(i.startedAt) : null, completedAt: i.completedAt ? new Date(i.completedAt) : null } }); } catch {}
    }
  }
  if (activityLogs?.length) {
    for (const al of activityLogs) {
      try { await prisma.activityLog.create({ data: { ...al, timestamp: new Date(al.timestamp) } }); } catch {}
    }
  }
  if (employeeDocuments?.length) {
    for (const ed of employeeDocuments) {
      try { await prisma.employeeDocument.create({ data: { ...ed, createdAt: new Date(ed.createdAt), updatedAt: new Date(ed.updatedAt) } }); } catch {}
    }
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("company_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("backupFile") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const fileContent = await file.text();
    const parsedData = JSON.parse(fileContent);

    if (!parsedData.version || !parsedData.data) {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    // Step 1: Wipe everything
    await wipeDatabase();

    // Step 2: Insert all backup data
    await insertData(parsedData.data);

    return NextResponse.json({ success: true, message: "Database wiped and restored successfully from backup!" });
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: "Failed to restore database. Ensure the JSON file is valid." }, { status: 500 });
  }
}
