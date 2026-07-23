import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, AlertTriangle } from "lucide-react";
import TeamChatClient from "./TeamChatClient";
import MeetingClient from "./MeetingClient";
import { waitUntil } from "@vercel/functions";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { id: true, name: true, teamId: true }
  });

  if (!employee?.teamId) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <AlertTriangle size={40} color="var(--amber)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Team Assigned</h2>
        <p style={{ color: "var(--text-secondary)" }}>You haven&apos;t been assigned to a team yet.</p>
      </div>
    );
  }

  const team = await prisma.team.findUnique({
    where: { id: employee.teamId },
    include: {
      members: {
        select: { id: true, name: true, designation: true, email: true, photoUrl: true, employeeCode: true }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          employee: { select: { id: true, name: true, photoUrl: true } }
        }
      }
    }
  });

  if (!team) return <div>Team not found</div>;

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    waitUntil(
      prisma.teamMessage.deleteMany({
        where: { teamId: team.id, createdAt: { lt: yesterday } }
      })
    );
  } catch {}

  const serializedTeam = {
    ...team,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    messages: team.messages.reverse().map((m: any) => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    }))
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>My Team</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
        <TeamChatClient messages={serializedTeam.messages} currentUserId={employee.id} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <MeetingClient initialMeetings={[]} currentUser={employee.id} />
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} color="var(--purple)" /> Team Members
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {serializedTeam.members.map((m: any) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                    {m.photoUrl ? <img src={m.photoUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name} {m.id === employee.id && "(You)"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.designation} • {m.employeeCode}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
