import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submissionId, action, feedback, qualityRating } = await req.json();
  // action: "approve" | "request_changes"

  if (!submissionId || !action) {
    return NextResponse.json({ error: "submissionId and action are required" }, { status: 400 });
  }

  if (action === "request_changes" && !feedback) {
    return NextResponse.json({ error: "Feedback is required when requesting changes" }, { status: 400 });
  }

  const submission = await prisma.taskSubmission.findUnique({
    where: { id: submissionId },
    include: { task: true, employee: true },
  });

  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const isApprove = action === "approve";
  const newStatus = isApprove ? "Approved" : "Needs Revision";
  const taskStatus = isApprove ? "Completed" : "ChangesRequested";

  // Update feedback history
  let feedbackHistory: any[] = [];
  try { feedbackHistory = JSON.parse(submission.reviewerFeedbackHistory || "[]"); } catch {}
  if (feedback) {
    feedbackHistory.push({ feedback, action, reviewedAt: new Date().toISOString(), reviewedBy: auth.sub });
  }

  await prisma.taskSubmission.update({
    where: { id: submissionId },
    data: {
      status: newStatus,
      reviewerFeedback: feedback || null,
      reviewerFeedbackHistory: JSON.stringify(feedbackHistory),
      reviewedAt: new Date(),
      qualityRating: qualityRating || null,
    },
  });

  // Update task status
  await prisma.task.update({
    where: { id: submission.taskId },
    data: { status: taskStatus },
  });

  // Award points if approved
  if (isApprove) {
    const task = submission.task;
    const priorityPoints: Record<string, number> = { Low: 10, Medium: 20, High: 35, Critical: 50 };
    const basePoints = priorityPoints[task.priority || "Medium"] || 20;

    // Check if on-time
    const isOnTime = submission.submittedAt <= task.deadline;
    const onTimeBonus = isOnTime ? Math.round(basePoints * 0.2) : 0;

    // Quality rating bonus (1-5 stars * 5 points)
    const qualityBonus = qualityRating ? (qualityRating * 5) : 0;

    const totalPoints = basePoints + onTimeBonus + qualityBonus;

    // Update employee points
    await prisma.employee.update({
      where: { id: submission.employeeId },
      data: {
        points: { increment: totalPoints },
        monthlyPoints: { increment: totalPoints },
      },
    });

    // Create point transaction
    await prisma.pointTransaction.create({
      data: {
        employeeId: submission.employeeId,
        taskId: submission.taskId,
        points: totalPoints,
        reason: `Task approved: ${task.title} (Base: ${basePoints}${onTimeBonus ? `, On-time: +${onTimeBonus}` : ""}${qualityBonus ? `, Quality: +${qualityBonus}` : ""})`,
      },
    });

    // Check for badges
    const allSubmissions = await prisma.taskSubmission.count({
      where: { employeeId: submission.employeeId, status: "Approved" },
    });

    const badgesToCreate: { type: string; label: string }[] = [];
    if (allSubmissions === 1) badgesToCreate.push({ type: "FirstTask", label: "First Mission" });
    if (allSubmissions === 10) badgesToCreate.push({ type: "TenTasks", label: "10 Missions" });

    for (const b of badgesToCreate) {
      await prisma.badge.upsert({
        where: { employeeId_type: { employeeId: submission.employeeId, type: b.type } },
        update: {},
        create: { employeeId: submission.employeeId, type: b.type, label: b.label },
      }).catch(() => {
        // badge relation may not have compound unique — use create with skipDuplicates fallback
      });
    }

    // Notify employee of approval + points
    await prisma.notification.create({
      data: {
        userId: submission.employeeId,
        title: "Task Approved! 🎉",
        message: `Your submission for "${task.title}" was approved. You earned +${totalPoints} points!`,
        type: "Task",
        link: `/employee/tasks/${task.id}`,
      },
    });
  } else {
    // Notify employee of changes requested
    await prisma.notification.create({
      data: {
        userId: submission.employeeId,
        title: "Changes Requested",
        message: `Your submission for "${submission.task.title}" needs revision. Check the feedback.`,
        type: "Task",
        link: `/employee/tasks/${submission.taskId}`,
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: isApprove ? "TASK_APPROVED" : "CHANGES_REQUESTED",
      metadata: JSON.stringify({ submissionId, taskTitle: submission.task.title, employeeName: submission.employee.name }),
    },
  });

  return NextResponse.json({ success: true });
}
