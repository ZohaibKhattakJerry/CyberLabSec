import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
      badges: { orderBy: { awardedAt: "asc" } },
      pointTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { points: true, reason: true, createdAt: true },
      },
      submissions: {
        where: { status: "Approved" },
        select: { id: true, submittedAt: true, reviewedAt: true },
      },
    },
    orderBy: { points: "desc" },
  });

  // Sort by all-time and monthly
  const allTime = [...employees].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
  const monthly = [...employees].sort((a, b) => b.monthlyPoints - a.monthlyPoints).map((e, i) => ({ ...e, rank: i + 1 }));

  // Per-team stats
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

  const teamRankings = teams.map(t => ({
    id: t.id,
    name: t.name,
    totalPoints: t.members.reduce((s, m) => s + m.points, 0),
    monthlyPoints: t.members.reduce((s, m) => s + m.monthlyPoints, 0),
    memberCount: t.members.length,
  })).sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json({ allTime, monthly, teamRankings });
}
