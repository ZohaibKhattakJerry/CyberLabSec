import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import TaskDetailClient from "./TaskDetailClient";

export const dynamic = "force-dynamic";

export default async function EmployeeTaskDetailPage({ params }: { params: { taskId: string } }) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: {
      team: { select: { id: true, name: true } },
      submissions: { where: { employeeId: auth.sub }, orderBy: { submittedAt: 'desc' } }
    }
  });

  if (!task) redirect("/employee/tasks");

  const serializedTask = {
    ...task,
    deadline: task.deadline.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    submissions: task.submissions.map(s => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      
    }))
  };

  return <TaskDetailClient task={serializedTask} employeeId={auth.sub} />;
}
