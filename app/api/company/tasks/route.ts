import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tasks = await prisma.task.findMany({
    include: {
      team: { select: { id: true, name: true } },
      submissions: {
        include: {
          employee: { select: { id: true, name: true, employeeCode: true } }
        },
        orderBy: { submittedAt: "desc" }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teamId, title, brief, deadline, priority, checklist, attachments, assigneeId } = await req.json();
  if (!teamId || !title || !deadline) {
    return NextResponse.json({ error: "teamId, title, and deadline are required" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      teamId,
      title: title.trim(),
      brief: brief?.trim() || "",
      deadline: new Date(deadline),
      createdBy: auth.sub,
      priority: priority || "Medium",
      status: "Assigned",
      checklist: checklist ? JSON.stringify(checklist) : "[]",
      attachments: attachments ? JSON.stringify(attachments) : "[]",
      assigneeId: assigneeId || null,
    },
  });

  // Notify team members or specific assignee
  let targetEmployees: { id: string }[] = [];
  if (assigneeId) {
    targetEmployees = [{ id: assigneeId }];
  } else {
    targetEmployees = await prisma.employee.findMany({ where: { teamId, status: "Active" }, select: { id: true } });
  }

  if (targetEmployees.length > 0) {
    await prisma.notification.createMany({
      data: targetEmployees.map((member) => ({
        userId: member.id,
        title: "New Task Assigned",
        message: `New objective: ${task.title} — Due ${new Date(deadline).toLocaleDateString()}`,
        type: "Task",
        link: `/employee/tasks/${task.id}`,
      })),
    });
  }

  return NextResponse.json({ success: true, task }, { status: 201 });
}
