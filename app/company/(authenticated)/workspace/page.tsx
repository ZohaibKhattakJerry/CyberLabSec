import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeamsClient from "./TeamsClient";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") redirect("/company/login");

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
    take: 200,
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

  const leaves = await (prisma as any).leaveRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      employee: {
        select: {
          name: true,
          designation: true,
          employeeCode: true,
          team: { select: { name: true } },
        },
      },
    },
  }).catch(() => []);

  return (
    <TeamsClient
      teams={JSON.parse(JSON.stringify(teams || []))}
      employees={employees}
      allTasks={JSON.parse(JSON.stringify(tasks || []))}
      initialLeaves={JSON.parse(JSON.stringify(leaves || []))}
    />
  );
}
