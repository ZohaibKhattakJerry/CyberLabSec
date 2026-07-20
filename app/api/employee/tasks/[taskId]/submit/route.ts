import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { textResponse, linkResponse, files } = await req.json();

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: { team: true }
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Find existing submission to increment version
  const existingSub = await prisma.taskSubmission.findFirst({
    where: { taskId: task.id, employeeId: auth.sub },
    orderBy: { version: "desc" }
  });

  const version = existingSub ? existingSub.version + 1 : 1;

  // Since it's versioned, we might just update the existing one or create a new one. 
  // Let's create or update based on if we need historical versions. The schema usually has 1 submission per employee per task, but lets upsert.
  // Wait, `prisma.taskSubmission` doesn't have a unique constraint on [taskId, employeeId] unless defined. Let's assume we update the existing if it exists.
  
  if (existingSub) {
    await prisma.taskSubmission.update({
      where: { id: existingSub.id },
      data: {
        status: "Under Review",
        textResponse,
        linkResponse,
        files: JSON.stringify(files || []),
        version,
        submittedAt: new Date()
      }
    });
  } else {
    await prisma.taskSubmission.create({
      data: {
        taskId: task.id,
        employeeId: auth.sub,
        status: "Under Review",
        textResponse,
        linkResponse,
        files: JSON.stringify(files || []),
        version
      }
    });
  }

  // Also update task status if it's assigned to individual
  if (task.assigneeId === auth.sub) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "Under Review" }
    });
  } else if (task.teamId) {
    // If it's a team task, maybe change status if everyone submitted, but let's just leave it or mark it Submitted.
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "Submitted" }
    });
  }

  return NextResponse.json({ success: true });
}
