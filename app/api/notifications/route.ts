import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = auth.role === "admin" ? "admin" : auth.sub;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let allItems = [...notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    isAnnouncement: false,
    content: null,
  }))];

  if (auth.role === "employee") {
    const employee = await prisma.employee.findUnique({
      where: { id: auth.sub },
      select: { teamId: true }
    });

    if (employee) {
      const now = new Date();
      const rawAnnouncements = await prisma.announcement.findMany({
        where: {
          OR: [
            { scope: "Company" },
            { scope: "Team", teamId: employee.teamId || undefined },
            { scope: "Individual", employeeId: auth.sub },
          ],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
        },
        orderBy: { sentAt: "desc" },
        take: 10,
        include: { sentBy: { select: { name: true } } },
      });

      const myReceipts = await prisma.announcementReadReceipt.findMany({
        where: { employeeId: auth.sub },
        select: { announcementId: true },
      });
      const readSet = new Set(myReceipts.map(r => r.announcementId));

      const announcementItems = rawAnnouncements.map(a => ({
        id: a.id,
        title: "Announcement",
        message: a.title,
        type: "announcement",
        link: "",
        read: readSet.has(a.id),
        createdAt: a.sentAt.toISOString(),
        isAnnouncement: true,
        content: a.content,
      }));

      allItems = [...allItems, ...announcementItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  return NextResponse.json({ notifications: allItems });
}
