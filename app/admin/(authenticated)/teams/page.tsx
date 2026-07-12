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

  const serialized = teams.map((t: any) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    tasks: t.tasks.map((tk: any) => ({ ...tk, deadline: tk.deadline.toISOString() })),
  }));

  return <TeamsClient teams={serialized} employees={employees} />;
}
