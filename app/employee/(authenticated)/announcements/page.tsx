import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Megaphone, Building2, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { teamId: true },
  });

  if (!employee) redirect("/employee/login");

  const now = new Date();
  
  const rawAnnouncements = await prisma.announcement.findMany({
    where: {
      OR: [
        { scope: "Company" },
        { scope: "Team", teamId: employee.teamId || undefined },
        { scope: "Individual", employeeId: auth.sub },
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        }
      ]
    },
    orderBy: { sentAt: "desc" },
    include: {
      sentBy: { select: { name: true, designation: true, employeeCode: true } },
      team: { select: { name: true } },
    },
  });

  // Sort pinned first
  const announcements = [...rawAnnouncements].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Announcements</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</p>
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <Megaphone size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No announcements yet.</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>Announcements from your admin and team leads will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {announcements.map((a) => (
            <div key={a.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: a.scope === "Company" ? "rgba(59,130,246,0.15)" : "rgba(168,85,247,0.15)",
                  }}>
                    {a.scope === "Company" ? <Building2 size={18} color="var(--blue)" /> : <Users size={18} color="var(--purple)" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{a.sentBy.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.sentBy.designation}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`badge ${a.scope === "Company" ? "badge-blue" : a.scope === "Team" ? "badge-purple" : "badge-amber"}`}>
                    {a.scope === "Company" ? "Company-wide" : a.scope === "Team" ? `Team: ${a.team?.name}` : "Personal"}
                  </span>
                  {a.isPinned && <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 6px", fontSize: 10 }}>📌 Pinned</span>}
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{format(a.sentAt, "MMM d, yyyy h:mm a")}</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", borderLeft: "3px solid var(--border-accent)", paddingLeft: 16 }}>
                {a.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
