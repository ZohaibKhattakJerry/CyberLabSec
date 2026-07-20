import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeeLeaderboardClient from "./EmployeeLeaderboardClient";

export const dynamic = "force-dynamic";

export default async function EmployeeLeaderboardPage() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  const me = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: {
      id: true,
      points: true,
      monthlyPoints: true,
      badges: { orderBy: { awardedAt: "asc" } },
    },
  });

  if (!me) redirect("/employee/login");

  const allEmployees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: {
      id: true,
      name: true,
      designation: true,
      employeeCode: true,
      photoUrl: true,
      points: true,
      monthlyPoints: true,
      teamId: true,
      team: { select: { name: true } },
      badges: { select: { id: true, type: true, label: true, awardedAt: true } },
    },
    orderBy: { points: "desc" },
    take: 100
  });

  const myCompletedTasks = await prisma.taskSubmission.count({
    where: { employeeId: me.id, status: "Approved" }
  });
  
  const mySubmissions = await prisma.taskSubmission.findMany({
    where: { employeeId: me.id, status: "Approved" },
    select: { submittedAt: true, reviewedAt: true }
  });
  const myOnTimeCount = mySubmissions.filter((s) => s.reviewedAt && s.submittedAt <= s.reviewedAt).length;
  const myOnTimeRate = myCompletedTasks > 0 ? Math.round((myOnTimeCount / myCompletedTasks) * 100) : 0;

  const serializedEmployees = allEmployees.map((e) => ({
    ...e,
    submissionsCount: 0
  }));

  const serializedMyBadges = me.badges.map((b) => ({
    ...b,
    awardedAt: b.awardedAt.toISOString(),
  }));

  return (
    <EmployeeLeaderboardClient
      employees={serializedEmployees}
      myEmployeeId={me.id}
      myTotalPoints={me.points}
      myMonthlyPoints={me.monthlyPoints}
      myBadges={serializedMyBadges}
      myCompletedTasks={myCompletedTasks}
      myOnTimeRate={myOnTimeRate}
    />
  );
}
