import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeeDetailsClient from "./EmployeeDetailsClient";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") redirect("/company/login");

  const { employeeId } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      team: true,
      documents: { orderBy: { createdAt: "desc" } },
      applicant: true
    }
  });

  if (!employee) redirect("/company/employees");

  return <EmployeeDetailsClient employee={JSON.parse(JSON.stringify(employee))} />;
}
