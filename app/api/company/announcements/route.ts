import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { sendAnnouncement } from "@/lib/email";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { scope, teamId, employeeId, message, sendEmail, isPinned, expiresAt } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (scope === "Team" && !teamId) {
    return NextResponse.json({ error: "Team ID is required for team announcements" }, { status: 400 });
  }
  if (scope === "Individual" && !employeeId) {
    return NextResponse.json({ error: "Employee ID is required for individual announcements" }, { status: 400 });
  }

  // Get admin name from AdminConfig
  let adminName = "Company Admin";
  try {
    const config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
    if (config?.data) {
      const parsed = JSON.parse(config.data);
      adminName = parsed.companyName || parsed.adminName || "Company Admin";
    }
  } catch {}

  const announcement = await prisma.announcement.create({
    data: {
      scope,
      teamId: scope === "Team" ? teamId : null,
      employeeId: scope === "Individual" ? employeeId : null,
      message: message.trim(),
      isPinned: isPinned || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sentById: null,
    },
  });

  let emails: string[] = [];
  let userIds: string[] = [];
  if (scope === "Company") {
    const allEmp = await prisma.employee.findMany({ where: { status: "Active" }, select: { id: true, email: true } });
    emails = allEmp.map((e: any) => e.email);
    userIds = allEmp.map((e: any) => e.id);
  } else if (scope === "Team") {
    const teamEmp = await prisma.employee.findMany({ where: { teamId, status: "Active" }, select: { id: true, email: true } });
    emails = teamEmp.map((e: any) => e.email);
    userIds = teamEmp.map((e: any) => e.id);
  } else if (scope === "Individual") {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, email: true } });
    if (emp) {
      emails = [emp.email];
      userIds = [emp.id];
    }
  }

  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((id: string) => ({
        userId: id,
        title: scope === "Company" ? "📢 Company Announcement" : scope === "Team" ? "👥 Team Announcement" : "📬 Personal Announcement",
        message: message.trim().substring(0, 80) + (message.trim().length > 80 ? "..." : ""),
        type: "Alert",
        link: "/employee/announcements",
      })),
    });
  }

  if (sendEmail && emails.length > 0) {
    const subject = scope === "Company" ? "Company Announcement" : scope === "Team" ? "Team Announcement" : "Personal Announcement";
    await sendAnnouncement(emails, subject, message.trim(), adminName).catch(console.error);
  }

  return NextResponse.json({ success: true, announcement }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  return NextResponse.json({ announcements });
}
