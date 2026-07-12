import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/portal/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: {
      id: true, name: true, email: true, designation: true,
      employeeCode: true, employmentType: true, photoUrl: true,
      startDate: true, endDate: true, status: true,
      teamId: true, policyAcknowledgedAt: true,
      githubUrl: true, linkedinUrl: true,
      team: { select: { name: true } },
    },
  });

  if (!employee) redirect("/portal/login");

  const activityLogs = await prisma.activityLog.findMany({
    where: { actorId: employee.id },
    orderBy: { timestamp: "desc" },
    take: 30,
  });

  return (
    <ProfileClient
      employee={{
        ...employee,
        startDate: employee.startDate.toISOString(),
        endDate: employee.endDate?.toISOString() ?? null,
        policyAcknowledgedAt: employee.policyAcknowledgedAt?.toISOString() ?? null,
      }}
      activityLogs={activityLogs.map((l: any) => ({
        ...l,
        timestamp: l.timestamp.toISOString(),
      }))}
    />
  );
}
