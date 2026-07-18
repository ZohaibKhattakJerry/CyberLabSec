import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, Mail, Shield } from "lucide-react";
import TeamChatClient from "./TeamChatClient";
import MeetingClient from "./MeetingClient";
import { waitUntil } from "@vercel/functions";

export default async function TeamPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { teamId: true }
  });

  if (!employee?.teamId) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
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

  // Opportunistic cleanup: delete files older than 24 hours to save DB storage
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    waitUntil(
      prisma.teamMessage.updateMany({
        where: {
          teamId: employee.teamId,
          fileUrl: { not: null },
          createdAt: { lt: yesterday }
        },
        data: {
          fileUrl: null,
          fileName: null,
          fileType: null,
          fileSize: null
        }
      })
    );
  } catch (err) {
    console.error("Failed to cleanup old chat files:", err);
  }

  const meetings = await prisma.meetingRequest.findMany({
    where: { teamId: employee.teamId },
    orderBy: { createdAt: 'desc' },
    include: { proposer: { select: { name: true, photoUrl: true } } }
  }).catch(() => []);

  const serializedMessages = team.messages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString()
  }));

  const serializedMeetings = JSON.parse(JSON.stringify(meetings));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, background: "rgba(168,85,247,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users color="var(--purple)" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Team: {team.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{team.members.length} Members</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {team.members.map((member: any) => (
          <div key={member.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--text-primary)", fontSize: 18 }}>
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  {member.name}
                  {member.id === team.leadEmployeeId && <span title="Team Lead" style={{ display: "flex", alignItems: "center" }}><Shield size={14} color="var(--purple)" /></span>}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 8 }}>{member.designation}</p>
                <a href={`mailto:${member.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", textDecoration: "none" }}>
                  <Mail size={12} /> {member.email}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
        <div>
          <MeetingClient initialMeetings={serializedMeetings} currentUser={auth.sub} />
        </div>
        
        <div>
          <TeamChatClient messages={serializedMessages} currentUserId={auth.sub} />
        </div>
      </div>
    </div>
  );
}
