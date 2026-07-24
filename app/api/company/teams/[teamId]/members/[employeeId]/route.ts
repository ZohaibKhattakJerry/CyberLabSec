import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

// DELETE /api/company/teams/[teamId]/members/[employeeId] — remove member from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teamId, employeeId } = await params;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Remove employee from team
  await prisma.employee.update({
    where: { id: employeeId },
    data: { teamId: null },
  });

  // If this employee was the lead, clear the lead
  if (team.leadEmployeeId === employeeId) {
    await prisma.team.update({
      where: { id: teamId },
      data: { leadEmployeeId: null },
    });
  }

  // Notify employee
  await prisma.notification.create({
    data: {
      userId: employeeId,
      title: "Team Update",
      message: `You have been removed from the "${team.name}" team.`,
      type: "Info",
      link: "/employee/tasks",
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
