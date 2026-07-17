import { prisma } from "@/lib/prisma";
import TeamsClient from "./TeamsClient";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: {
      members: {
        where: { status: "Active" },
        select: { id: true, name: true, designation: true, employeeCode: true },
      },
      tasks: {
        select: { id: true, title: true, deadline: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      _count: { select: { tasks: true, messages: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const employees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: { id: true, name: true, employeeCode: true, designation: true, teamId: true },
  });

  const tasks = await prisma.task.findMany({
    include: {
      team: { 
        select: { 
          id: true, 
          name: true, 
          members: { select: { id: true, name: true, employeeCode: true } } 
        } 
      },
      submissions: {
        include: {
          employee: { select: { id: true, name: true, employeeCode: true } }
        },
        orderBy: { submittedAt: "desc" }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedTeams = teams.map((t: any) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    tasks: t.tasks.map((tk: any) => ({ ...tk, deadline: tk.deadline.toISOString() })),
  }));

  const serializedTasks = tasks.map((t: any) => ({
    ...t,
    deadline: t.deadline.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    submissions: t.submissions.map((s: any) => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      reviewedAt: s.reviewedAt?.toISOString() || null,
    }))
  }));

  return <TeamsClient teams={serializedTeams} employees={employees} initialTasks={serializedTasks} />;
}
