import { prisma } from "@/lib/prisma";
import AnnouncementsClient from "./AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      sentBy: { select: { name: true } },
      team: { select: { name: true } },
      employee: { select: { name: true } },
      reads: { include: { employee: { select: { name: true, employeeCode: true } } }, orderBy: { readAt: "asc" } },
      _count: { select: { reads: true } },
    },
  });

  // Get total employee count for acknowledgement % calculation
  const totalEmployees = await prisma.employee.count({ where: { status: "Active" } });

  const teams = await prisma.team.findMany({ select: { id: true, name: true } });
  const employees = await prisma.employee.findMany({ where: { status: "Active" }, select: { id: true, name: true, employeeCode: true } });

  const serialized = announcements.map((a: unknown) => ({
    ...a,
    sentAt: a.sentAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() || null,
    readCount: a._count?.reads || 0,
    readers: a.reads.map((r: unknown) => ({ name: r.employee?.name || "Unknown", employeeCode: r.employee?.employeeCode || "", readAt: r.readAt.toISOString() })),
  }));

  return <AnnouncementsClient announcements={serialized} teams={teams} employees={employees} totalEmployees={totalEmployees} />;
}
