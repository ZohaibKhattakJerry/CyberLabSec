import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PortalLayout from "../PortalLayout";
import OnboardingWizard from "./OnboardingWizard";

export default async function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthFromCookies();
  if (!auth || (auth.role !== "employee" && auth.role !== "admin")) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: {
      id: true, name: true, email: true, designation: true, employeeCode: true,
      employmentType: true, photoUrl: true, mustResetPassword: true,
      policyAcknowledgedAt: true, teamId: true,
      team: { select: { id: true, name: true } },
    },
  });

  if (!employee || employee.mustResetPassword) {
    if (employee?.mustResetPassword) redirect("/employee/reset-password");
    redirect("/employee/login");
  }

  if (!employee.policyAcknowledgedAt) {
    return <OnboardingWizard employee={employee} />;
  }

  return (
    <PortalLayout employee={employee}>
      {children}
    </PortalLayout>
  );
}
