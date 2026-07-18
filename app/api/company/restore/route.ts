import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow more time for restoration

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

    const { 
      teams, employees, jobPostings, applicants, 
      announcements, tasks, taskSubmissions, offerLetters, 
      interviewSessions, activityLogs, employeeDocuments 
    } = parsedData.data;

    // Use a transaction if possible, or execute sequentially to respect Foreign Keys
    // 1. Independent or Root Entities
    if (teams && teams.length > 0) {
      for (const t of teams) {
        await prisma.team.upsert({
          where: { id: t.id },
          update: { ...t },
          create: { ...t },
        });
      }
    }

    if (jobPostings && jobPostings.length > 0) {
      for (const j of jobPostings) {
        await prisma.jobPosting.upsert({
          where: { id: j.id },
          update: { ...j },
          create: { ...j },
        });
      }
    }

    // 2. Employees & Applicants (Applicants reference JobPostings, Employees reference Teams)
    if (applicants && applicants.length > 0) {
      for (const a of applicants) {
        await prisma.applicant.upsert({
          where: { id: a.id },
          update: { ...a },
          create: { ...a },
        });
      }
    }

    if (employees && employees.length > 0) {
      for (const e of employees) {
        await prisma.employee.upsert({
          where: { employeeCode: e.employeeCode },
          update: { ...e },
          create: { ...e },
        });
      }
    }

    // 3. Dependent Entities (Tasks reference Teams & Employees)
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        await prisma.task.upsert({
          where: { id: t.id },
          update: { ...t },
          create: { ...t },
        });
      }
    }

    if (taskSubmissions && taskSubmissions.length > 0) {
      for (const ts of taskSubmissions) {
        await prisma.taskSubmission.upsert({
          where: { id: ts.id },
          update: { ...ts },
          create: { ...ts },
        });
      }
    }

    // 4. Other Relations
    if (announcements && announcements.length > 0) {
      for (const a of announcements) {
        await prisma.announcement.upsert({
          where: { id: a.id },
          update: { ...a },
          create: { ...a },
        });
      }
    }

    if (offerLetters && offerLetters.length > 0) {
      for (const ol of offerLetters) {
        await prisma.offerLetter.upsert({
          where: { id: ol.id },
          update: { ...ol },
          create: { ...ol },
        });
      }
    }

    if (interviewSessions && interviewSessions.length > 0) {
      for (const i of interviewSessions) {
        await prisma.interviewSession.upsert({
          where: { id: i.id },
          update: { ...i },
          create: { ...i },
        });
      }
    }

    if (activityLogs && activityLogs.length > 0) {
      for (const al of activityLogs) {
        await prisma.activityLog.upsert({
          where: { id: al.id },
          update: { ...al },
          create: { ...al },
        });
      }
    }

    if (employeeDocuments && employeeDocuments.length > 0) {
      for (const ed of employeeDocuments) {
        await prisma.employeeDocument.upsert({
          where: { id: ed.id },
          update: { ...ed },
          create: { ...ed },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Database restored successfully!" });

  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: "Failed to restore database. Ensure JSON file is correct." }, { status: 500 });
  }
}
