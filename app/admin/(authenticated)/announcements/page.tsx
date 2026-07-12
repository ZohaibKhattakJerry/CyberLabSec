import { prisma } from "@/lib/prisma";
import AnnouncementsClient from "./AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      sentBy: { select: { name: true } },
      team: { select: { name: true } },
      employee: { select: { name: true } }
    },
  });

  const teams = await prisma.team.findMany({ select: { id: true, name: true } });
  const employees = await prisma.employee.findMany({ where: { status: "Active" }, select: { id: true, name: true, employeeCode: true } });

  const serialized = announcements.map(a => ({
    ...a,
    sentAt: a.sentAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() || null,
  }));

  return <AnnouncementsClient announcements={serialized} teams={teams} employees={employees} />;
}
