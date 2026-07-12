import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId } = await params;
  const body = await req.json();
  const { teamId, designation, status } = body;

  const updateData: Record<string, unknown> = {};
  if (teamId !== undefined) updateData.teamId = teamId || null;
  if (designation !== undefined) updateData.designation = designation;
  if (status !== undefined) {
    if (!["Active", "Terminated"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updateData.status = status;
    if (status === "Terminated") updateData.endDate = new Date();
  }

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: updateData,
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub, actorType: "Admin", action: "EMPLOYEE_UPDATED",
      metadata: JSON.stringify({ employeeId, changes: updateData }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, employee: updated });
}
