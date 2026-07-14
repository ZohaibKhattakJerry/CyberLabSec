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
      submissions: {
        where: { status: "Approved" },
        select: { id: true, submittedAt: true, reviewedAt: true },
      },
    },
    orderBy: { points: "desc" },
  });

  const myRow = allEmployees.find((e) => e.id === me.id);
  const myCompletedTasks = myRow?.submissions.length ?? 0;
  const myOnTimeCount =
    myRow?.submissions.filter(
      (s) => s.reviewedAt && s.submittedAt <= s.reviewedAt
    ).length ?? 0;
  const myOnTimeRate =
    myCompletedTasks > 0
      ? Math.round((myOnTimeCount / myCompletedTasks) * 100)
      : 0;

  // Serialize dates to strings for client components
  const serializedEmployees = allEmployees.map((e) => ({
    ...e,
    badges: e.badges.map((b) => ({ ...b, awardedAt: b.awardedAt.toISOString() })),
    submissions: e.submissions.map((s) => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      reviewedAt: s.reviewedAt?.toISOString() ?? null,
    })),
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
