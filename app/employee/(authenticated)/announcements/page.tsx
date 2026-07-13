import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Megaphone, Building2, Users, Bell, Clock, Info } from "lucide-react";

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

  const pinnedCount = announcements.filter(a => a.isPinned).length;

  return (
    <div>
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={24} color="var(--purple)" /> 
            Announcements & Directives
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {announcements.length} total transmission{announcements.length !== 1 ? "s" : ""} 
            {pinnedCount > 0 && <span style={{ marginLeft: 8, color: "var(--amber)" }}>( {pinnedCount} Pinned )</span>}
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ padding: 80, textAlign: "center", borderStyle: "dashed" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Megaphone size={32} opacity={0.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>All quiet on the network.</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, margin: "0 auto" }}>
            There are no active company or team directives at this time. New transmissions will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {announcements.map((a, i) => {
            const isCompany = a.scope === "Company";
            const isTeam = a.scope === "Team";
            
            return (
              <div 
                key={a.id} 
                className="card hover:border-[var(--border-accent)] transition-all" 
                style={{ 
                  padding: 0, 
                  overflow: "hidden", 
                  animation: "fade-up 0.4s ease-out backwards", 
                  animationDelay: `${i * 0.05}s`,
                  border: a.isPinned ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--border-subtle)",
                  boxShadow: a.isPinned ? "0 4px 20px rgba(245, 158, 11, 0.05)" : "none"
                }}
              >
                {a.isPinned && (
                  <div style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "6px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📌</span> High Priority Directive
                  </div>
                )}
                
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: isCompany ? "rgba(59,130,246,0.15)" : isTeam ? "rgba(168,85,247,0.15)" : "rgba(34,197,94,0.15)",
                      }}>
                        {isCompany ? <Building2 size={20} color="var(--blue)" /> : isTeam ? <Users size={20} color="var(--purple)" /> : <Info size={20} color="var(--green)" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{a.sentBy.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span>{a.sentBy.designation}</span>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)", opacity: 0.5 }} />
                          <span style={{ color: isCompany ? "var(--blue)" : isTeam ? "var(--purple)" : "var(--green)", fontWeight: 600 }}>
                            {isCompany ? "Company-wide" : isTeam ? `Team: ${a.team?.name}` : "Personal"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 12 }}>
                      <Clock size={12} /> {format(a.sentAt, "MMM d, yyyy · h:mm a")}
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: 15, 
                    color: "var(--text-secondary)", 
                    lineHeight: 1.6, 
                    whiteSpace: "pre-wrap", 
                    borderLeft: `3px solid ${isCompany ? "var(--blue)" : isTeam ? "var(--purple)" : "var(--green)"}`, 
                    paddingLeft: 16,
                    background: "rgba(255,255,255,0.01)",
                    padding: "16px 20px 16px 20px",
                    borderRadius: "0 8px 8px 0"
                  }}>
                    {a.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
