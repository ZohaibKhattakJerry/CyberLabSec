import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeeTasksClient from "./EmployeeTasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { teamId: true }
  });

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { teamId: employee?.teamId || "NO_TEAM" },
        { assigneeId: auth.sub }
      ]
    },
    orderBy: { deadline: "asc" },
    include: {
      submissions: {
        where: { employeeId: auth.sub }
      }
    }
  }).catch(() => []);

  const serializedTasks = tasks.map((t: any) => ({
    ...t,
    deadline: t.deadline.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    submissions: t.submissions.map((s: any) => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      
    })),
  }));

  return <EmployeeTasksClient tasks={serializedTasks} hasTeam={!!employee?.teamId} />;
}
