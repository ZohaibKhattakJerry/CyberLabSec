import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teamId } = await params;

  // Unassign all members first
  await prisma.employee.updateMany({ where: { teamId }, data: { teamId: null } });

  await prisma.team.delete({ where: { id: teamId } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teamId } = await params;
  const { name, leadEmployeeId } = await req.json();

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(name ? { name } : {}),
      ...(leadEmployeeId !== undefined ? { leadEmployeeId } : {}),
    },
  });

  return NextResponse.json({ success: true, team: updated });
}
