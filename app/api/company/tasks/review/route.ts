import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submissionId, status } = await req.json();
  if (!submissionId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const submission = await prisma.taskSubmission.update({
    where: { id: submissionId },
    data: { status },
    include: { task: true, employee: true },
  });

  // Create notification for employee
  await prisma.notification.create({
    data: {
      userId: submission.employeeId,
      title: "Submission Reviewed",
      message: `Your submission for "${submission.task.title}" has been marked as ${status}.`,
      type: "Task",
      link: `/employee/tasks/${submission.taskId}`,
    },
  });

  return NextResponse.json({ success: true, status });
}
