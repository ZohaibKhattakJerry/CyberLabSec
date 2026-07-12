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
      team: { select: { id: true, name: true } },
      submissions: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates to avoid passing Date objects to client component
  const serializedTasks = tasks.map((t) => ({
    ...t,
    deadline: t.deadline.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <TasksClient initialTasks={serializedTasks} teams={teams} />;
}
