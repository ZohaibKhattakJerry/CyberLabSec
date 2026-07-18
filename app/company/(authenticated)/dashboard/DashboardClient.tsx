"use client";

import Link from "next/link";
import { Users, Briefcase, FileText, CheckCircle, AlertTriangle, Clock, Star, Plus, UserPlus, Megaphone, ArrowRight, TrendingUp, Activity } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

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

  const taskData = [
    { name: "Assigned", value: taskStatusMap["Assigned"] || 0, color: "var(--text-muted)" },
    { name: "In Progress", value: taskStatusMap["InProgress"] || 0, color: "var(--blue)" },
    { name: "Submitted", value: taskStatusMap["Submitted"] || 0, color: "var(--amber)" },
    { name: "Revision", value: taskStatusMap["ChangesRequested"] || 0, color: "var(--red)" },
    { name: "Completed", value: taskStatusMap["Completed"] || 0, color: "var(--green)" },
  ].filter(d => d.value > 0);

  const funnelData = funnelOrder.map(stage => ({
    name: stage.replace("Interview ", "Int. "),
    value: funnelMap[stage] || 0
  }));

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Command Center</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Real-time overview of CyberLabSec operations.</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12 }}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div className="card" style={{ 
              height: "100%", 
              display: "flex", 
              flexDirection: "column", 
              padding: "20px 22px", 
              background: `linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
              border: (kpi as any).urgent ? `1px solid ${kpi.color}50` : `1px solid rgba(255,255,255,0.05)`,
              borderTop: `3px solid ${kpi.color}`,
              backdropFilter: "blur(10px)",
              cursor: "pointer", 
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 24px -10px ${kpi.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${kpi.color}15 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}20` }}>
                  <kpi.icon size={18} color={kpi.color} />
                </div>
                {(kpi as any).urgent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: kpi.color, marginLeft: "auto", boxShadow: `0 0 10px ${kpi.color}` }} />}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: (kpi as any).urgent ? kpi.color : "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.03em" }}>{kpi.value}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginTop: 8 }}>{kpi.label}</div>
              {(kpi as any).sublabel ? (
                <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>{(kpi as any).sublabel}</div>
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
          {taskData.length > 0 ? (
            <div style={{ height: 220, position: "relative", overflowX: "auto" }}>
              <div style={{ minWidth: 280, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} 
                    itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 600 }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{taskTotal}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total</div>
              </div>
            </div>
          ) : (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>No task data available</div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={14} color="var(--purple)" /> Hiring Funnel
          </h2>
          <div style={{ height: 220, overflowX: "auto" }}>
            <div style={{ minWidth: 350, height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} 
                  itemStyle={{ color: 'var(--purple)', fontSize: 13, fontWeight: 600 }} 
                  labelStyle={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--purple)" strokeWidth={2} fillOpacity={1} fill="url(#colorPurple)" />
              </AreaChart>
            </ResponsiveContainer>
            </div>
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
