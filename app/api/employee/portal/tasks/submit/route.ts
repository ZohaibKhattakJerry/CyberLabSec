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
  const summary = (formData.get("summary") as string)?.trim() || null;
  const link = (formData.get("link") as string)?.trim() || null;
  const versionParam = formData.get("version");
  const version = versionParam ? parseInt(versionParam as string, 10) : 1;

  if (!taskId) return NextResponse.json({ error: "Task ID required" }, { status: 400 });
  if (!summary) return NextResponse.json({ error: "Work summary is required" }, { status: 400 });

  const fileEntry = formData.get("file") as File | null;

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

  // Check for existing submission (compound unique removed, use findFirst)
  const existing = await prisma.taskSubmission.findFirst({
    where: { taskId, employeeId: auth.sub },
    orderBy: { version: "desc" },
  });

  // Block re-submission unless it's a revision request
  if (existing && ["Pending", "Approved"].includes(existing.status)) {
    return NextResponse.json({ error: "You have already submitted this task" }, { status: 409 });
  }

  // Save file if provided
  const savedPaths: string[] = existing ? JSON.parse(existing.files ?? "[]") : [];
  if (fileEntry && fileEntry.size > 0) {
    if (fileEntry.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: `File "${fileEntry.name}" exceeds 50 MB limit` }, { status: 400 });
    }
    const path = await saveFile(fileEntry, `task-${taskId}`, "task");
    savedPaths.push(path);
  }

  // Require at least a file or a link
  if (savedPaths.length === 0 && !link) {
    return NextResponse.json({ error: "Please attach a file or provide a link to your work." }, { status: 400 });
  }

  if (existing) {
    await prisma.taskSubmission.update({
      where: { id: existing.id },
      data: {
        summary,
        textResponse: summary,
        linkResponse: link ?? existing.linkResponse,
        files: JSON.stringify(savedPaths),
        status: "Pending",
        version,
        submittedAt: new Date(),
      },
    });
  } else {
    await prisma.taskSubmission.create({
      data: {
        taskId,
        employeeId: auth.sub,
        summary,
        textResponse: summary,
        linkResponse: link ?? null,
        files: JSON.stringify(savedPaths),
        status: "Pending",
        version,
      },
    });
  }

  // Update task status to Submitted
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "Submitted" },
  }).catch(() => {});

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Employee",
      action: "TASK_SUBMIT",
      metadata: JSON.stringify({ taskId, taskTitle: task.title, version }),
    },
  }).catch(() => {});

  // Notify admin of new/revised submission
  await prisma.notification.create({
    data: {
      userId: "admin",
      title: version > 1 ? "Task Resubmission" : "New Task Submission",
      message: `${employee.name || "An employee"} submitted${version > 1 ? ` v${version} of` : ""} "${task.title}".`,
      type: "Task",
      link: `/company/tasks/${taskId}`,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
