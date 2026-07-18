import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow more time for backup

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("company_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all relevant platform data
    const [
      employees, teams, jobPostings, applicants, announcements,
      tasks, taskSubmissions, offerLetters, interviewSessions, 
      activityLogs, employeeDocuments
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
      prisma.employeeDocument.findMany()
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
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
        employeeDocuments
      },
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
        employeeDocuments: employeeDocuments.length
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cyberlabsec-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup generation failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
