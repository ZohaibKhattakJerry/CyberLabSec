import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { taskId } = params;

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
