import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { employeeId, points, reason } = await req.json();
  if (!employeeId || typeof points !== "number" || !reason?.trim()) {
    return NextResponse.json({ error: "employeeId, points (number), and reason are required" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      points: { increment: points },
      monthlyPoints: { increment: points },
    },
  });

  await prisma.pointTransaction.create({
    data: {
      employeeId,
      points,
      reason: `Manual adjustment: ${reason}`,
      adjustedBy: auth.sub,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: auth.sub,
      actorType: "Admin",
      action: "POINTS_ADJUSTED",
      metadata: JSON.stringify({ employeeId, employeeName: employee.name, points, reason }),
    },
  });

  return NextResponse.json({ success: true });
}
