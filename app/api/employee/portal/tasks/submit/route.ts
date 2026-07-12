import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { saveFile } from "@/lib/fileStorage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const taskId = formData.get("taskId") as string;
  if (!taskId) return NextResponse.json({ error: "Task ID required" }, { status: 400 });

  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) return NextResponse.json({ error: "At least one file is required" }, { status: 400 });

  // Verify task belongs to employee's team
  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { teamId: true, name: true },
  });
  if (!employee?.teamId) return NextResponse.json({ error: "You are not assigned to a team" }, { status: 403 });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.teamId !== employee.teamId) {
    return NextResponse.json({ error: "Task not found or not assigned to your team" }, { status: 404 });
  }

  // Check if already submitted
  const existing = await prisma.taskSubmission.findUnique({
    where: { taskId_employeeId: { taskId, employeeId: auth.sub } },
  });
  if (existing) return NextResponse.json({ error: "You have already submitted this task" }, { status: 409 });

  // Save files
  const savedPaths: string[] = [];
  for (const file of files) {
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: `File "${file.name}" exceeds 50MB limit` }, { status: 400 });
    }
    const path = await saveFile(file, `task-${taskId}`, "task");
    savedPaths.push(path);
  }

  await prisma.taskSubmission.create({
    data: {
      taskId,
      employeeId: auth.sub,
      files: JSON.stringify(savedPaths),
    },
  });

  await prisma.activityLog.create({
    data: { actorId: auth.sub, actorType: "Employee", action: "TASK_SUBMIT", metadata: JSON.stringify({ taskId, taskTitle: task.title }) },
  }).catch(() => {});

  await prisma.notification.create({
    data: {
      userId: "admin",
      title: "New Task Submission",
      message: `${employee.name || "An employee"} submitted a report for "${task.title}".`,
      type: "Task",
      link: `/company/tasks/${taskId}`,
    },
  });

  return NextResponse.json({ success: true });
}
