import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeeLeaderboardClient from "./EmployeeLeaderboardClient";

export const dynamic = "force-dynamic";

export default async function EmployeeLeaderboardPage() {
  const auth = await getAuthFromCookies();
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
      employeeCode: true,
      designation: true,
      photoUrl: true,
      points: true,
      monthlyPoints: true,
      team: { select: { name: true } },
      badges: { select: { id: true, type: true, label: true, awardedAt: true } },
      _count: {
        select: {
          submissions: { where: { status: "Approved" } }
        }
      }
    },
    orderBy: { points: "desc" },
    take: 100
  });

  const myCompletedTasks = await prisma.taskSubmission.count({
    where: { employeeId: me.id, status: "Approved" }
  });
  
  // On time rate is hard to calculate without loading all submissions, so we'll just set it to 100% or omit for performance if it gets too heavy, 
  // but since it's just for 'me', we can fetch 'me's submissions!
  const mySubmissions = await prisma.taskSubmission.findMany({
    where: { employeeId: me.id, status: "Approved" },
    select: { submittedAt: true, reviewedAt: true }
  });
  const myOnTimeCount = mySubmissions.filter((s) => s.reviewedAt && s.submittedAt <= s.reviewedAt).length;
  const myOnTimeRate = myCompletedTasks > 0 ? Math.round((myOnTimeCount / myCompletedTasks) * 100) : 0;

  // Serialize dates to strings for client components
  const serializedEmployees = allEmployees.map((e) => ({
    ...e,
    badges: e.badges.map((b) => ({ ...b, awardedAt: b.awardedAt.toISOString() })),
    submissionsCount: e._count.submissions
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
