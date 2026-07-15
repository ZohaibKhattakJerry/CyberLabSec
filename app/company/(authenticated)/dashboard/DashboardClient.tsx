"use client";

import Link from "next/link";
import { Users, Briefcase, FileText, CheckCircle, AlertTriangle, Clock, Star, Plus, UserPlus, Megaphone, ArrowRight, TrendingUp, Activity } from "lucide-react";

interface DashboardData {
  stats: { employees: number; openPostings: number; newApplications: number; activeTasks: number; overdueTasks: number; pendingApprovals: number; pendingReviews: number };
  recentActivity: Array<{ id: string; action: string; actorId: string; metadata: string | null; createdAt: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasksByStatus: Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hiringFunnel: Array<any>;
  topEmployees: Array<{ id: string; name: string; designation: string | null; points: number; monthlyPoints: number }>;
}

const ACTION_LABELS: Record<string, string> = {
  TASK_APPROVED: "Task approved", TASK_CREATED: "Task assigned", BULK_REJECT: "Bulk rejected applications",
  EMPLOYEE_OFFBOARDED: "Employee offboarded", EMPLOYEE_HIRED: "New hire completed",
  CHANGES_REQUESTED: "Changes requested", OFFER_SENT: "Offer letter sent",
  FINAL_APPROVE: "Application approved", ANNOUNCEMENT_CREATED: "Announcement published",
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { stats, recentActivity, tasksByStatus, hiringFunnel, topEmployees } = data;

  const kpis = [
    { label: "Active Employees", value: stats.employees, icon: Users, color: "var(--purple)", bg: "rgba(168,85,247,0.1)", href: "/company/employees" },
    { label: "Open Positions", value: stats.openPostings, icon: Briefcase, color: "var(--blue)", bg: "rgba(59,130,246,0.1)", href: "/company/postings" },
    { label: "New Applications", value: stats.newApplications, icon: FileText, color: "var(--green)", bg: "rgba(34,197,94,0.1)", href: "/company/applications", sublabel: "This week" },
    { label: "Active Tasks", value: stats.activeTasks, icon: CheckCircle, color: "var(--amber)", bg: "rgba(245,158,11,0.1)", href: "/company/tasks" },
    { label: "Overdue Tasks", value: stats.overdueTasks, icon: AlertTriangle, color: "var(--red)", bg: "rgba(239,68,68,0.1)", href: "/company/tasks", urgent: stats.overdueTasks > 0 },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Clock, color: "var(--amber)", bg: "rgba(245,158,11,0.1)", href: "/company/tasks", urgent: stats.pendingReviews > 0 },
    { label: "Final Approvals", value: stats.pendingApprovals, icon: Star, color: "var(--purple)", bg: "rgba(168,85,247,0.1)", href: "/company/final-approval", urgent: stats.pendingApprovals > 0 },
  ];

  const attentionItems = [
    stats.overdueTasks > 0 && { text: `${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""} — needs action`, href: "/company/tasks", label: "Review Tasks", color: "var(--red)" },
    stats.pendingReviews > 0 && { text: `${stats.pendingReviews} submission${stats.pendingReviews > 1 ? "s" : ""} awaiting review`, href: "/company/tasks", label: "Review Now", color: "var(--amber)" },
    stats.pendingApprovals > 0 && { text: `${stats.pendingApprovals} candidate${stats.pendingApprovals > 1 ? "s" : ""} awaiting Final Approval`, href: "/company/final-approval", label: "Approve", color: "var(--purple)" },
  ].filter(Boolean) as Array<{ text: string; href: string; label: string; color: string }>;

  const taskStatusMap: Record<string, number> = {};
  tasksByStatus.forEach((t) => { taskStatusMap[t.status] = t._count.id; });
  const taskTotal = Math.max(Object.values(taskStatusMap).reduce((a, b) => a + b, 0), 1);

  const funnelOrder = ["Applied", "Reviewing", "Shortlisted", "InterviewInvited", "Interview Completed", "Final Approval", "Offer", "Hired"];
  const funnelMap: Record<string, number> = {};
  hiringFunnel.forEach((f) => { funnelMap[f.status] = f._count.id; });
  const maxFunnel = Math.max(...Object.values(funnelMap), 1);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Command Center</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Real-time overview of CyberLabSec operations.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12 }}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px 18px", border: (kpi as any).urgent ? `1px solid ${kpi.color}35` : undefined, cursor: "pointer", transition: "transform 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <kpi.icon size={17} color={kpi.color} />
                </div>
                {(kpi as any).urgent && <div style={{ width: 7, height: 7, borderRadius: "50%", background: kpi.color, marginLeft: "auto", boxShadow: `0 0 6px ${kpi.color}` }} />}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: (kpi as any).urgent ? kpi.color : "var(--text-primary)", lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{kpi.label}</div>
              {(kpi as any).sublabel ? (
                <div style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.7, marginTop: "auto" }}>{(kpi as any).sublabel}</div>
              ) : (
                <div style={{ marginTop: "auto" }} />
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Attention Needed */}
      {attentionItems.length > 0 && (
        <div className="card" style={{ padding: 18, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> Attention Needed
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {attentionItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: `3px solid ${item.color}` }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.text}</span>
                <Link href={item.href} className="btn btn-sm" style={{ flexShrink: 0, background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}35`, gap: 4 }}>
                  {item.label} <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Create Posting", icon: Plus, href: "/company/postings" },
            { label: "Assign Task", icon: CheckCircle, href: "/company/tasks" },
            { label: "Add Employee", icon: UserPlus, href: "/company/employees" },
            { label: "Publish Announcement", icon: Megaphone, href: "/company/announcements" },
            { label: "View Applications", icon: FileText, href: "/company/applications" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="btn btn-secondary" style={{ gap: 7, fontSize: 13 }}>
              <a.icon size={14} /> {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={14} color="var(--purple)" /> Tasks by Status
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { key: "Assigned", label: "Assigned", color: "var(--text-muted)" },
              { key: "InProgress", label: "In Progress", color: "var(--blue)" },
              { key: "Submitted", label: "Submitted", color: "var(--amber)" },
              { key: "ChangesRequested", label: "Revision", color: "var(--red)" },
              { key: "Completed", label: "Completed", color: "var(--green)" },
            ].map(({ key, label, color }) => {
              const count = taskStatusMap[key] || 0;
              const pct = Math.round((count / taskTotal) * 100);
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    <span style={{ color, fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={14} color="var(--purple)" /> Hiring Funnel
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {funnelOrder.map((stage) => {
              const count = funnelMap[stage] || 0;
              if (count === 0) return null;
              const pct = Math.round((count / maxFunnel) * 100);
              return (
                <div key={stage}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{stage}</span>
                    <span style={{ color: "var(--purple)", fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--purple)", borderRadius: 4, opacity: 0.65 + 0.35 * (pct / 100) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performers + Recent Activity */}
      <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Top Performers (Month)</h2>
          {topEmployees.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No performance data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {topEmployees.map((emp, i) => (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: i === 0 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "#fbbf24" : "var(--text-muted)", flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{emp.designation || "Employee"}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", flexShrink: 0 }}>{emp.monthlyPoints} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No recent activity.</p>
          ) : (
            <div style={{ display: "grid", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {recentActivity.map((log) => {
                let meta: Record<string, string> = {};
                try { meta = JSON.parse(log.metadata || "{}"); } catch {}
                return (
                  <div key={log.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)", marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                        {ACTION_LABELS[log.action] || log.action}
                        {meta.employeeName && <strong style={{ color: "var(--text-primary)" }}> — {meta.employeeName}</strong>}
                        {meta.taskTitle && <strong style={{ color: "var(--text-primary)" }}> — {meta.taskTitle}</strong>}
                        {meta.count && <span style={{ color: "var(--text-muted)" }}> ({meta.count})</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
