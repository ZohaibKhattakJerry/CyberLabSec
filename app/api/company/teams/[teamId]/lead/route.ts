import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<any> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { leadEmployeeId } = await req.json();

  const { teamId } = await params;
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { leadEmployeeId },
  });

  if (leadEmployeeId) {
    await prisma.announcement.create({
      data: {
        scope: "Individual",
        employeeId: leadEmployeeId,
        message: `You have been promoted to Team Lead for ${team.name}!`,
        sentById: null,
      }
    });

    await prisma.notification.create({
      data: {
        userId: leadEmployeeId,
        title: "Promoted to Team Lead",
        message: `You are now the lead for ${team.name}`,
        type: "Alert",
        link: "/employee/dashboard",
      }
    });
  }

  return NextResponse.json({ success: true, team }, { status: 200 });
}
