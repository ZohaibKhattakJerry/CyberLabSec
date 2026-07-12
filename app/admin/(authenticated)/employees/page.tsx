import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
  });

  const teams = await prisma.team.findMany({ select: { id: true, name: true } });

  const serialized = employees.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    policyAcknowledgedAt: e.policyAcknowledgedAt?.toISOString() ?? null,
  }));

  return <EmployeesClient employees={serialized} teams={teams} />;
}
