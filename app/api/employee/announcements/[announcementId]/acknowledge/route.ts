import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ announcementId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "employee") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { announcementId } = await params;

  // Verify the announcement exists and is accessible to this employee
  const employee = await prisma.employee.findUnique({ where: { id: auth.sub }, select: { teamId: true } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const announcement = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      OR: [
        { scope: "Company" },
        { scope: "Team", teamId: employee.teamId || undefined },
        { scope: "Individual", employeeId: auth.sub },
      ],
    },
  });
  if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

  // Upsert read receipt
  await prisma.announcementReadReceipt.upsert({
    where: { announcementId_employeeId: { announcementId, employeeId: auth.sub } },
    create: { announcementId, employeeId: auth.sub },
    update: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
