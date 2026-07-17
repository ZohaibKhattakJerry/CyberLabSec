import { prisma } from "@/lib/prisma";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const teams = await prisma.team.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
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

  const serializedTasks = tasks.map(t => ({
    ...t,
    deadline: t.deadline.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    submissions: t.submissions.map(s => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      reviewedAt: s.reviewedAt?.toISOString() || null,
    }))
  }));

  const employees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: { id: true, name: true, employeeCode: true, teamId: true },
    orderBy: { name: "asc" }
  });

  return <TasksClient initialTasks={serializedTasks} teams={teams} employees={employees} />;
}
