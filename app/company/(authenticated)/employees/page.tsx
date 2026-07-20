import { prisma } from "@/lib/prisma";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const [employees, teams] = await Promise.all([
    prisma.employee.findMany({
      where: { employeeCode: { notIn: ["CyberLabSec", "ZohaibKhattak"] } },
      take: 200,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        employeeCode: true,
        employmentType: true,
        tier: true,
        status: true,
        photoUrl: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        applicantId: true,
        policyAcknowledgedAt: true,
        points: true,
        monthlyPoints: true,
        teamId: true,
        team: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.team.findMany({ select: { id: true, name: true } }),
  ]);

  const serialized = employees.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    policyAcknowledgedAt: e.policyAcknowledgedAt?.toISOString() ?? null,
  }));

  return <EmployeesClient employees={serialized} teams={teams} />;
}
