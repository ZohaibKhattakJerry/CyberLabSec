import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnnouncementsClient from "./AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  // const auth = await getAuthFromCookies("admin");
  // if (!auth || auth.role !== "admin") redirect("/company/login");

  const announcements = await prisma.announcement.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      sentBy: { select: { name: true } },
      team: { select: { name: true } },
      employee: { select: { name: true } },
      reads: {
        include: { employee: { select: { name: true, employeeCode: true } } },
        orderBy: { readAt: "asc" },
      },
      _count: { select: { reads: true } },
    },
  });

  const totalEmployees = await prisma.employee.count({ where: { status: "Active" } });
  const teams = await prisma.team.findMany({ select: { id: true, name: true } });
  const employees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: { id: true, name: true, employeeCode: true },
  });

  // Fetch recent company activities
  const [recentTasks, recentSubmissions, recentTeams, recentEmployees] = await Promise.all([
    prisma.task.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true, team: { select: { name: true } } },
    }),
    prisma.submission.findMany({
      take: 15,
      orderBy: { submittedAt: "desc" },
      include: {
        employee: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),
    prisma.team.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.employee.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, designation: true, createdAt: true },
    }),
  ]);

  // Build activity feed
  type RawActivity = {
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
  };
  
  const activities: RawActivity[] = [
    ...recentTasks.map(t => ({
      id: `task-${t.id}`,
      type: "task_assigned",
      title: "New Task Deployed",
      description: `"${t.title}" assigned to ${t.team?.name || "Direct Assignment"}`,
      time: t.createdAt.toISOString(),
    })),
    ...recentSubmissions.map(s => ({
      id: `sub-${s.id}`,
      type: "task_submitted",
      title: `${s.employee?.name || "Employee"} submitted a task`,
      description: `Submitted "${s.task?.title || "Unknown Task"}" — awaiting review`,
      time: s.submittedAt.toISOString(),
    })),
    ...recentTeams.map(t => ({
      id: `team-${t.id}`,
      type: "team_created",
      title: "New Team Created",
      description: `"${t.name}" team was created and is ready for member assignments`,
      time: t.createdAt.toISOString(),
    })),
    ...recentEmployees.map(e => ({
      id: `emp-${e.id}`,
      type: "employee_joined",
      title: `${e.name} joined the company`,
      description: `New ${e.designation || "employee"} has been onboarded`,
      time: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);

  const serialized = announcements.map((a: any) => ({
    ...a,
    sentAt: a.sentAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() || null,
    readCount: a._count?.reads || 0,
    readers: a.reads.map((r: any) => ({
      name: r.employee?.name || "Unknown",
      employeeCode: r.employee?.employeeCode || "",
      readAt: r.readAt.toISOString(),
    })),
  }));

  return (
    <AnnouncementsClient
      announcements={serialized}
      teams={teams}
      employees={employees}
      totalEmployees={totalEmployees}
      recentActivities={activities}
    />
  );
}
