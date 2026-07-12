import { prisma } from "@/lib/prisma";
import LeaderboardClient from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function EmployeeLeaderboardPage() {
  const employees = await prisma.employee.findMany({
    where: { status: "Active" },
    include: {
      team: { select: { name: true } },
      submissions: { where: { status: "Approved" } }
    },
  });

  const serialized = employees.map((e: any) => ({
    id: e.id,
    name: e.name,
    designation: e.designation,
    teamName: e.team?.name || "Unassigned",
    score: e.submissions.length * 10, // 10 pts per approved submission
    submissionsCount: e.submissions.length,
    photoUrl: e.photoUrl,
    tier: e.tier
  })).sort((a: any, b: any) => b.score - a.score);

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Leaderboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Global performance rankings.</p>
      </div>
      <LeaderboardClient employees={serialized} />
    </div>
  );
}
