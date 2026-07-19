"use client";

import Link from "next/link";
import { Users, Briefcase, FileText, CheckCircle, AlertTriangle, Clock, Star, Plus, UserPlus, Megaphone, ArrowRight, TrendingUp, Activity, Award } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  stats: { employees: number; openPostings: number; newApplications: number; activeTasks: number; overdueTasks: number; pendingApprovals: number; pendingReviews: number; totalTasks: number; totalCompletedTasks: number; totalHired: number; totalApplicants: number };
  recentActivity: Array<{ id: string; action: string; actorId: string; metadata: string | null; createdAt: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasksByStatus: Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hiringFunnel: Array<any>;
  topEmployees: Array<{ id: string; name: string; designation: string | null; points: number; monthlyPoints: number }>;
}

const ACTION_LABELS: Record<string, string> = {
  TASK_APPROVED: "Task approved", TASK_CREATED: "Task assigned", BULK_REJECT: "Bulk rejected",
  EMPLOYEE_OFFBOARDED: "Employee offboarded", EMPLOYEE_HIRED: "New hire completed",
  CHANGES_REQUESTED: "Changes requested", OFFER_SENT: "Offer letter sent",
  FINAL_APPROVE: "Application approved", ANNOUNCEMENT_CREATED: "Announcement published",
};

const ACTION_COLORS: Record<string, string> = {
  TASK_APPROVED: "var(--green)", TASK_CREATED: "var(--amber)", BULK_REJECT: "var(--red)",
  EMPLOYEE_OFFBOARDED: "var(--red)", EMPLOYEE_HIRED: "var(--green)",
  CHANGES_REQUESTED: "var(--red)", OFFER_SENT: "var(--purple)",
  FINAL_APPROVE: "var(--green)", ANNOUNCEMENT_CREATED: "var(--purple)",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function formatRelativeTime(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { stats, recentActivity, tasksByStatus, hiringFunnel, topEmployees } = data;

  const kpis = [
    { label: "Active Employees", value: stats.employees, icon: Users, color: "var(--purple)", bg: "rgba(168,85,247,0.1)", href: "/company/employees" },
    { label: "Open Positions", value: stats.openPostings, icon: Briefcase, color: "var(--blue)", bg: "rgba(59,130,246,0.1)", href: "/company/postings" },
    { label: "New Applications", value: stats.newApplications, icon: FileText, color: "var(--green)", bg: "rgba(34,197,94,0.1)", href: "/company/applications", sublabel: "This week" },
    { label: "Active Tasks", value: stats.activeTasks, icon: CheckCircle, color: "var(--amber)", bg: "rgba(245,158,11,0.1)", href: "/company/tasks" },
    { label: "Overdue Tasks", value: stats.overdueTasks, icon: AlertTriangle, color: "var(--red)", bg: "rgba(239,68,68,0.1)", href: "/company/tasks", urgent: stats.overdueTasks > 0 },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Clock, color: "var(--amber)", bg: "rgba(245,158,11,0.1)", href: "/company/tasks", urgent: stats.pendingReviews > 0 },
  ];

  const attentionItems = [
    stats.overdueTasks > 0 && { text: `${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""} — needs action`, href: "/company/tasks", label: "Review Tasks", color: "var(--red)" },
    stats.pendingReviews > 0 && { text: `${stats.pendingReviews} submission${stats.pendingReviews > 1 ? "s" : ""} awaiting review`, href: "/company/tasks", label: "Review Now", color: "var(--amber)" },
  ].filter(Boolean) as Array<{ text: string; href: string; label: string; color: string }>;

  const taskStatusMap: Record<string, number> = {};
  tasksByStatus.forEach((t) => { taskStatusMap[t.status] = t._count.id; });
  const taskTotal = Math.max(Object.values(taskStatusMap).reduce((a, b) => a + b, 0), 1);

  const funnelOrder = ["Applied", "Reviewing", "Shortlisted", "InterviewInvited", "Interview Completed", "Final Approval", "Offer", "Hired"];
  const funnelMap: Record<string, number> = {};
  hiringFunnel.forEach((f) => { funnelMap[f.status] = f._count.id; });

  const taskData = [
    { name: "Assigned", value: taskStatusMap["Assigned"] || 0, color: "var(--text-muted)" },
    { name: "In Progress", value: taskStatusMap["InProgress"] || 0, color: "var(--blue)" },
    { name: "Submitted", value: taskStatusMap["Submitted"] || 0, color: "var(--amber)" },
    { name: "Revision", value: taskStatusMap["ChangesRequested"] || 0, color: "var(--red)" },
    { name: "Completed", value: taskStatusMap["Completed"] || 0, color: "var(--green)" },
  ];

  const funnelData = funnelOrder.map(stage => ({
    name: stage.replace("Interview ", "Int. "),
    value: funnelMap[stage] || 0
  }));

  const maxPoints = Math.max(...topEmployees.map(e => e.monthlyPoints), 1);

  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.totalCompletedTasks / stats.totalTasks) * 100) : 0;
  const appConversionRate = stats.totalApplicants > 0 ? Math.round((stats.totalHired / stats.totalApplicants) * 100) : 0;
  // Make up a utilization metric based on tasks assigned vs active employees
  const expectedTasksPerEmp = 3;
  const utilization = stats.employees > 0 ? Math.min(100, Math.round(((stats.activeTasks + stats.overdueTasks) / (stats.employees * expectedTasksPerEmp)) * 100)) : 0;

  return (
    <div className="animate-fade-up" style={{ display: "grid", gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6, color: "var(--text-primary)" }}>Corporate Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>Real-time operations overview</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/company/postings" className="btn btn-secondary" style={{ gap: 6 }}>
            <Plus size={16} /> Post Job
          </Link>
          <Link href="/company/announcements" className="btn btn-primary" style={{ gap: 6 }}>
            <Megaphone size={16} /> Announcement
          </Link>
        </div>
      </div>

      {/* Attention Needed */}
      {attentionItems.length > 0 && (
        <div className="card" style={{ padding: 18, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--red)" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--red)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} /> ATTENTION NEEDED
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {attentionItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 16px", background: "rgba(15, 23, 42, 0.4)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{item.text}</span>
                <Link href={item.href} className="btn btn-sm" style={{ flexShrink: 0, background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}35`, gap: 6 }}>
                  {item.label} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div className="card" style={{ 
              height: "100%", 
              display: "flex", 
              flexDirection: "column", 
              padding: "24px", 
              background: `linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)`,
              border: (kpi as any).urgent ? `1px solid ${kpi.color}80` : `1px solid rgba(255,255,255,0.05)`,
              borderTop: `4px solid ${kpi.color}`,
              backdropFilter: "blur(12px)",
              cursor: "pointer", 
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = `0 16px 32px -12px ${kpi.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, background: `radial-gradient(circle, ${kpi.color}20 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}30` }}>
                  <kpi.icon size={22} color={kpi.color} />
                </div>
                {(kpi as any).urgent && (
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: kpi.color, zIndex: 2 }} />
                    <div style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: kpi.color, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(0.5); }
                        50% { opacity: 0; transform: scale(1.5); }
                      }
                    `}} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 8 }}>{kpi.value}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{kpi.label}</div>
              {(kpi as any).sublabel ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>{(kpi as any).sublabel}</div>
              ) : (
                <div style={{ marginTop: "auto" }} />
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 24, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(12px)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={18} color="var(--purple)" /> Task Status Distribution
          </h2>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 300, display: "grid", gap: 16 }}>
            {taskData.map((t: any) => {
              const percent = taskTotal > 0 ? (t.value / taskTotal) * 100 : 0;
              return (
                <div key={t.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{t.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t.value} <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}>({percent.toFixed(1)}%)</span></span>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: t.color, borderRadius: 4, transition: "width 1s ease-out" }} />
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(12px)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} color="var(--purple)" /> Hiring Funnel
          </h2>
          <div style={{ height: 260, overflowX: "auto" }}>
            <div style={{ minWidth: 400, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '12px 16px' }} 
                    itemStyle={{ color: 'var(--purple)', fontSize: 15, fontWeight: 700 }} 
                    labelStyle={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorPurple)" activeDot={{ r: 6, fill: "var(--purple)", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 24, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={18} color="var(--amber)" /> Top Performers
            </h2>
            <Link href="/company/employees" style={{ fontSize: 13, color: "var(--purple)", fontWeight: 600, textDecoration: "none" }}>Full Leaderboard →</Link>
          </div>
          
          {topEmployees.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>No performance data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {topEmployees.map((emp: any, i: number) => {
                const percent = (emp.monthlyPoints / maxPoints) * 100;
                return (
                  <div key={emp.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: i < 3 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: i < 3 ? "#fbbf24" : "var(--text-muted)" }}>
                      {MEDALS[i] || `#${i + 1}`}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{emp.designation || "Employee"}</div>
                      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                        <div style={{ width: `${percent}%`, height: "100%", background: i === 0 ? "var(--amber)" : "var(--blue)", borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? "var(--amber)" : "var(--text-secondary)" }}>{emp.monthlyPoints} <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>pts</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(12px)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No recent activity.</p>
          ) : (
            <div style={{ display: "grid", gap: 16, maxHeight: 360, overflowY: "auto", paddingRight: 8 }}>
              {recentActivity.slice(0, 15).map((log: any) => {
                let meta: Record<string, string> = {};
                try { meta = JSON.parse(log.metadata || "{}"); } catch {}
                const color = ACTION_COLORS[log.action] || "var(--blue)";
                return (
                  <div key={log.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}>
                    <div style={{ position: "absolute", left: 5, top: 20, bottom: -20, width: 2, background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, marginTop: 4, flexShrink: 0, zIndex: 1, boxShadow: `0 0 10px ${color}60`, border: "2px solid #0f172a" }} />
                    <div style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{ACTION_LABELS[log.action] || log.action}</span>
                        {meta.employeeName && <span> for <strong style={{ color: "var(--text-primary)" }}>{meta.employeeName}</strong></span>}
                        {meta.taskTitle && <span> — <strong style={{ color: "var(--text-primary)" }}>{meta.taskTitle}</strong></span>}
                        {meta.count && <span style={{ color: "var(--text-muted)" }}> ({meta.count} items)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontWeight: 500 }}>{formatRelativeTime(log.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bottom Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
        <div className="card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Task Completion</div>
            <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
              <div style={{ width: `${taskCompletionRate}%`, height: "100%", background: "var(--green)", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--green)" }}>{taskCompletionRate}%</div>
        </div>
        <div className="card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>App Conversion</div>
            <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
              <div style={{ width: `${appConversionRate}%`, height: "100%", background: "var(--purple)", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--purple)" }}>{appConversionRate}%</div>
        </div>
        <div className="card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Team Utilization</div>
            <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
              <div style={{ width: `${utilization}%`, height: "100%", background: "var(--blue)", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--blue)" }}>{utilization}%</div>
        </div>
      </div>
    </div>
  );
}
