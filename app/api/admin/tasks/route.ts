import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teamId, title, brief, deadline, createdBy } = await req.json();
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
      createdBy: createdBy || auth.sub,
      attachments: "[]",
    },
  });

  const teamMembers = await prisma.employee.findMany({ where: { teamId, status: "Active" } });
  if (teamMembers.length > 0) {
    await prisma.notification.createMany({
      data: teamMembers.map((member) => ({
        userId: member.id,
        title: "New Task Assigned",
        message: `You have a new task: ${task.title}`,
        type: "Task",
        link: `/portal/tasks`,
      })),
    });
  }

  return NextResponse.json({ success: true, task }, { status: 201 });
}
