import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await getAuthFromCookies("employee");
  if (!auth || auth.role !== "employee") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // IDOR: employee must be on the same team
  const emp = await prisma.employee.findUnique({ where: { id: auth.sub }, select: { teamId: true } });
  if (!emp || emp.teamId !== task.teamId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (task.status !== "Assigned") return NextResponse.json({ message: "Already started" }, { status: 200 });

  await prisma.task.update({ where: { id: taskId }, data: { status: "In Progress" } });

  // Notify via activity log
  await prisma.activityLog.create({
    data: { actorId: auth.sub, actorType: "Employee", action: "TASK_STARTED", metadata: JSON.stringify({ taskId: task.id, taskTitle: task.title }) }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
