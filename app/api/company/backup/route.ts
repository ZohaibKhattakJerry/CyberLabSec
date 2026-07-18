import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("company_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [employees, teams, postings, announcements] = await Promise.all([
      prisma.employee.findMany({
        select: {
          id: true, name: true, email: true, designation: true,
          employeeCode: true, employmentType: true, status: true,
          startDate: true, endDate: true, points: true, teamId: true,
        },
      }),
      prisma.team.findMany({ select: { id: true, name: true, createdAt: true } }),
      prisma.jobPosting.findMany({ select: { id: true, title: true, status: true, createdAt: true } }),
      prisma.announcement.findMany({ select: { id: true, title: true, message: true, scope: true, sentAt: true } }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: { employees, teams, postings, announcements },
      counts: {
        employees: employees.length,
        teams: teams.length,
        postings: postings.length,
        announcements: announcements.length,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cyberlabsec-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
