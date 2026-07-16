import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { _format } from "date-fns";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: {
      id: true, name: true, email: true, designation: true,
      employeeCode: true, employmentType: true, photoUrl: true,
      startDate: true, endDate: true, status: true,
      teamId: true, policyAcknowledgedAt: true,
      githubUrl: true, linkedinUrl: true,
      team: { select: { name: true } },
      badges: { select: { id: true, type: true, label: true, awardedAt: true } },
    },
  });

  if (!employee) redirect("/employee/login");

  const activityLogs = await prisma.activityLog.findMany({
    where: { actorId: employee.id, actorType: "Employee" },
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
        badges: employee.badges.map(b => ({ ...b, awardedAt: b.awardedAt.toISOString() })),
      }}
      activityLogs={activityLogs.map((l: unknown) => ({
        ...l,
        timestamp: l.timestamp.toISOString(),
      }))}
    />
  );
}
