import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submissionId, status, feedback } = await req.json();

  const submission = await prisma.taskSubmission.findUnique({
    where: { id: submissionId },
    include: { employee: true, task: true },
  });

  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  await prisma.taskSubmission.update({
    where: { id: submissionId },
    data: { 
      status,
      reviewerFeedback: feedback || submission.reviewerFeedback,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub, actorType: "Admin", action: "TASK_REVIEWED",
      metadata: JSON.stringify({ submissionId, status }),
    },
  }).catch(() => {});

  if (status === "Approved") {
    await prisma.notification.create({
      data: {
        userId: submission.employeeId,
        title: "Task Approved",
        message: `Your submission for "${submission.task.title}" was approved.`,
        type: "Task",
        link: `/employee/tasks/${submission.taskId}`,
      }
    });
  } else if (status === "Needs Revision") {
    await prisma.notification.create({
      data: {
        userId: submission.employeeId,
        title: "Task Revision Requested",
        message: `Your submission for "${submission.task.title}" requires revisions.`,
        type: "Task",
        link: `/employee/tasks/${submission.taskId}`,
      }
    });
  }

  return NextResponse.json({ success: true });
}
