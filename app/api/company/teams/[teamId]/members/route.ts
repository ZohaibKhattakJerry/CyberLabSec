import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

// POST /api/company/teams/[teamId]/members — add member to team
export async function POST(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teamId } = await params;
  const { employeeId } = await req.json();

  if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Assign employee to this team
  await prisma.employee.update({
    where: { id: employeeId },
    data: { teamId },
  });

  // Create a notification for the employee
  await prisma.notification.create({
    data: {
      userId: employeeId,
      title: "👥 You've been added to a team!",
      message: `You have been added to the "${team.name}" team. Check your workspace to see team tasks.`,
      type: "Info",
      link: "/employee/tasks",
    },
  }).catch(() => {});

  // Create an announcement scoped to individual
  await prisma.announcement.create({
    data: {
      scope: "Individual",
      employeeId,
      message: `Welcome to the "${team.name}" team! You have been added as a team member. Please check your Tasks section for any assigned objectives.`,
      isPinned: false,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
