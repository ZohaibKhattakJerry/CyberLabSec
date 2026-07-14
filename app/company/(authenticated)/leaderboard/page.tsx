import { prisma } from "@/lib/prisma";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function CompanyLeaderboardPage() {
  const employees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      designation: true,
      photoUrl: true,
      points: true,
      monthlyPoints: true,
      team: { select: { id: true, name: true } },
      badges: { orderBy: { awardedAt: "asc" }, select: { id: true, type: true, label: true, awardedAt: true } },
      submissions: { 
        where: { status: "Approved" }, 
        select: { 
          id: true, 
          qualityRating: true, 
          submittedAt: true,
          task: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: { points: "desc" },
  });

  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      members: {
        where: { status: "Active" },
        select: { points: true, monthlyPoints: true },
      },
    },
  });

  const allEmployeesList = await prisma.employee.findMany({
    where: { status: "Active" },
    select: { id: true, name: true, employeeCode: true },
  });

  const teamRankings = teams
    .map((t) => ({
      id: t.id,
      name: t.name,
      totalPoints: t.members.reduce((s, m) => s + m.points, 0),
      monthlyPoints: t.members.reduce((s, m) => s + m.monthlyPoints, 0),
      memberCount: t.members.length,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Serialize dates
  const serializedEmployees = employees.map((e) => ({
    ...e,
    badges: e.badges.map((b) => ({ ...b, awardedAt: b.awardedAt.toISOString() })),
    submissions: e.submissions.map((s) => ({ ...s, submittedAt: s.submittedAt.toISOString() })),
  }));

  return (
    <LeaderboardClient
      employees={serializedEmployees}
      teamRankings={teamRankings}
      allEmployees={allEmployeesList}
    />
  );
}
