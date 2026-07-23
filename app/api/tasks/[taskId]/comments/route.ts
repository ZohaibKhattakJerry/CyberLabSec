import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const auth = await getAuthFromCookies("any");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const { taskId } = await params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Auth check: employee must be the assignee or same team; admin always allowed
  if (auth.role === "employee" && task.assigneeId !== auth.sub) {
    // Check team
    const emp = await prisma.employee.findUnique({ where: { id: auth.sub }, select: { teamId: true } });
    if (!emp || emp.teamId !== task.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Determine sender name
  let senderName = "Admin";
  let senderRole = "admin";
  if (auth.role === "employee") {
    const emp = await prisma.employee.findUnique({ where: { id: auth.sub }, select: { name: true, designation: true } });
    senderName = emp?.name || "Employee";
    senderRole = "employee";
  }

  let comments: unknown[] = [];
  try { comments = JSON.parse(task.comments || "[]"); } catch {}

  const newComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorId: auth.sub,
    authorName: senderName,
    authorRole: senderRole,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  comments.push(newComment);

  await prisma.task.update({
    where: { id: taskId },
    data: { comments: JSON.stringify(comments) },
  });

  // Notify the other party (use correct Notification schema: userId, no taskId)
  if (auth.role === "admin" && task.assigneeId) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        type: "task_comment",
        title: "New comment on your task",
        message: `Admin commented on "${task.title}": "${text.trim().slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
        link: `/employee/tasks/${task.id}`,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ comment: newComment });
}
