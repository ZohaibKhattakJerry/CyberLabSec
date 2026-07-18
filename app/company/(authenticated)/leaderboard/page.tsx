import { prisma } from "@/lib/prisma";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function CompanyLeaderboardPage() {
  const employees = await prisma.employee.findMany({
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

  // Add default empty arrays since we optimized them out
  const serializedEmployees = employees.map((e) => ({
    ...e,
    badges: [],
    submissions: [],
  }));

  return (
    <LeaderboardClient
      employees={serializedEmployees}
      teamRankings={teamRankings}
      allEmployees={allEmployeesList}
    />
  );
}
