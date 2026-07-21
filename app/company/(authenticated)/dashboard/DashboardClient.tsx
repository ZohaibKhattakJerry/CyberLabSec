"use client";

import Link from "next/link";
import { Users, Briefcase, FileText, CheckCircle, AlertTriangle, Clock, Star, Plus, UserPlus, Megaphone, ArrowRight, TrendingUp, Activity, Award, BarChart2 } from "lucide-react";
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
    name: stage.replace("Interview ", "Int. ").replace(" Completed", "✓").replace("Final Approval", "Final"),
    value: funnelMap[stage] || 0
  }));

  const maxPoints = Math.max(...topEmployees.map(e => e.monthlyPoints), 1);

  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.totalCompletedTasks / stats.totalTasks) * 100) : 0;
  const appConversionRate = stats.totalApplicants > 0 ? Math.round((stats.totalHired / stats.totalApplicants) * 100) : 0;
  const expectedTasksPerEmp = 3;
  const utilization = stats.employees > 0 ? Math.min(100, Math.round(((stats.activeTasks + stats.overdueTasks) / (stats.employees * expectedTasksPerEmp)) * 100)) : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* === ANIMATIONS === */
        @keyframes co-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes co-pulse {
          0%, 100% { opacity: 0.7; transform: scale(0.5); }
          50% { opacity: 0; transform: scale(1.8); }
        }
        .co-fade-up { animation: co-fade-up 0.45s ease-out backwards; }
        .co-delay-1 { animation-delay: 0.07s; }
        .co-delay-2 { animation-delay: 0.14s; }
        .co-delay-3 { animation-delay: 0.21s; }
        .co-delay-4 { animation-delay: 0.28s; }

        /* === KPI CARD === */
        .co-kpi-card {
          background: rgba(15,20,35,0.5);
          border-radius: 16px;
          padding: 20px;
          border-top: 3px solid var(--kpi-color, rgba(255,255,255,0.1));
          border-left: 1px solid rgba(255,255,255,0.07);
          border-right: 1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-top-color 0.25s ease;
          cursor: pointer;
          text-decoration: none;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .co-kpi-card::after {
          content: '';
          position: absolute;
          top: -20px; right: -20px;
          width: 80px; height: 80px;
          background: radial-gradient(circle, var(--kpi-color, transparent) 0%, transparent 70%);
          opacity: 0.2;
          border-radius: 50%;
          pointer-events: none;
        }
        .co-kpi-card:hover {
          transform: translateY(-3px);
          border-color: rgba(168,85,247,0.25);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(168,85,247,0.08);
        }
        .co-kpi-card:active {
          transform: scale(0.98) translateY(0);
          box-shadow: none;
        }

        /* === GLASS CARD === */
        .co-glass {
          background: rgba(15,20,35,0.45);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .co-glass:hover {
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }

        /* === ATTENTION CARD === */
        .co-attention-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          flex-wrap: wrap;
        }

        /* === ACTION BUTTONS === */
        .co-action-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .co-action-link:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .co-action-link:active { transform: scale(0.95); filter: brightness(0.95); }

        .co-hdr-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          white-space: nowrap;
        }
        .co-hdr-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .co-hdr-btn:active { transform: scale(0.96); }

        /* === GRIDS === */
        .co-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 700px) {
          .co-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 380px) {
          .co-kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
        }

        .co-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 720px) {
          .co-two-col { grid-template-columns: 1fr; }
        }

        .co-stats-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 600px) {
          .co-stats-strip { grid-template-columns: 1fr; gap: 10px; }
        }

        /* === PROGRESS BAR === */
        .co-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        .co-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1.2s ease-out;
        }

        /* === TOP PERFORMER ROW === */
        .co-performer-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          transition: background 0.2s ease;
        }
        .co-performer-row:hover { background: rgba(255,255,255,0.04); }

        /* === ACTIVITY LOG ITEM === */
        .co-activity-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          position: relative;
        }
        .co-activity-content {
          flex: 1;
          padding: 11px 14px;
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.03);
          min-width: 0;
          transition: background 0.2s ease;
        }
        .co-activity-content:hover { background: rgba(255,255,255,0.04); }
      `}} />

      <div style={{ display: "grid", gap: 20, paddingBottom: 40 }}>
        
        {/* ── HEADER ── */}
        <div className="co-fade-up" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 4, color: "var(--text-primary)", lineHeight: 1.1 }}>Corporate Dashboard</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>Real-time operations overview</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/company/postings" className="co-hdr-btn" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Plus size={15} /> Post Job
            </Link>
            <Link href="/company/announcements" className="co-hdr-btn" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.9), rgba(99,102,241,0.9))", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(168,85,247,0.3)" }}>
              <Megaphone size={15} /> Announcement
            </Link>
          </div>
        </div>

        {/* ── ATTENTION NEEDED ── */}
        {attentionItems.length > 0 && (
          <div className="co-glass co-fade-up co-delay-1" style={{ padding: 18, borderLeft: "4px solid var(--red)", background: "rgba(239,68,68,0.04)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--red)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <AlertTriangle size={15} /> Attention Needed
            </h2>
            <div style={{ display: "grid", gap: 8 }}>
              {attentionItems.map((item, i) => (
                <div key={i} className="co-attention-item">
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{item.text}</span>
                  <Link href={item.href} className="co-action-link" style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}35` }}>
                    {item.label} <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div className="co-kpi-grid co-fade-up co-delay-1">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href} className="co-kpi-card" style={{ "--kpi-color": kpi.color } as React.CSSProperties}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}25` }}>
                  <kpi.icon size={20} color={kpi.color} />
                </div>
                {(kpi as any).urgent && (
                  <div style={{ position: "relative", width: 10, height: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: kpi.color, zIndex: 2 }} />
                    <div style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: kpi.color, animation: "co-pulse 2s ease infinite", opacity: 0.5 }} />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "clamp(28px,4vw,38px)", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 6 }}>{kpi.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{kpi.label}</div>
                {(kpi as any).sublabel && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>{(kpi as any).sublabel}</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* ── ANALYTICS ROW ── */}
        <div className="co-two-col co-fade-up co-delay-2">
          {/* Task Status */}
          <div className="co-glass" style={{ padding: "clamp(16px,3vw,24px)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={17} color="var(--purple)" /> Task Status
            </h2>
            <div style={{ display: "grid", gap: 14 }}>
              {taskData.map((t: any) => {
                const percent = taskTotal > 0 ? (t.value / taskTotal) * 100 : 0;
                return (
                  <div key={t.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{t.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {t.value} <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}>({percent.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="co-progress-bar">
                      <div className="co-progress-fill" style={{ width: `${percent}%`, background: t.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hiring Funnel */}
          <div className="co-glass" style={{ padding: "clamp(16px,3vw,24px)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={17} color="var(--purple)" /> Hiring Funnel
            </h2>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} interval={0} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '10px 14px' }} 
                    itemStyle={{ color: '#A855F7', fontSize: 14, fontWeight: 700 }} 
                    labelStyle={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--purple)" strokeWidth={2.5} fillOpacity={1} fill="url(#grad-purple)" activeDot={{ r: 5, fill: "var(--purple)", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── TOP PERFORMERS + ACTIVITY ── */}
        <div className="co-two-col co-fade-up co-delay-3">
          
          {/* Top Performers */}
          <div className="co-glass" style={{ padding: "clamp(16px,3vw,24px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <Award size={17} color="var(--amber)" /> Top Performers
              </h2>
              <Link href="/company/leaderboard" style={{ fontSize: 12, color: "var(--purple)", fontWeight: 600, textDecoration: "none" }}>Leaderboard →</Link>
            </div>
            
            {topEmployees.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: 0, fontStyle: "italic" }}>No performance data yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {topEmployees.map((emp: any, i: number) => {
                  const percent = (emp.monthlyPoints / maxPoints) * 100;
                  return (
                    <div key={emp.id} className="co-performer-row">
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: i < 3 ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                        {MEDALS[i] || `#${i + 1}`}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{emp.designation || "Employee"}</div>
                        <div className="co-progress-bar" style={{ height: 4 }}>
                          <div className="co-progress-fill" style={{ width: `${percent}%`, background: i === 0 ? "var(--amber)" : "var(--blue)" }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? "var(--amber)" : "var(--text-secondary)", flexShrink: 0, textAlign: 'right' }}>
                        {emp.monthlyPoints}<span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", display: "block" }}>pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="co-glass" style={{ padding: "clamp(16px,3vw,24px)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={17} color="var(--green)" /> Recent Activity
            </h2>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No recent activity.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, maxHeight: 360, overflowY: "auto", paddingRight: 4, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                {recentActivity.slice(0, 15).map((log: any) => {
                  let meta: Record<string, string> = {};
                  try { meta = JSON.parse(log.metadata || "{}"); } catch {}
                  const color = ACTION_COLORS[log.action] || "var(--blue)";
                  return (
                    <div key={log.id} className="co-activity-item">
                      <div style={{ position: "absolute", left: 5, top: 18, bottom: -12, width: 2, background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, marginTop: 14, flexShrink: 0, zIndex: 1, boxShadow: `0 0 10px ${color}50`, border: "2px solid rgba(5,3,12,0.9)" }} />
                      <div className="co-activity-content">
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{ACTION_LABELS[log.action] || log.action}</span>
                          {meta.employeeName && <span> for <strong style={{ color: "var(--text-primary)" }}>{meta.employeeName}</strong></span>}
                          {meta.taskTitle && <span> — <strong style={{ color: "var(--text-primary)" }}>{meta.taskTitle}</strong></span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5, fontWeight: 500 }}>{formatRelativeTime(log.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM STATS STRIP ── */}
        <div className="co-stats-strip co-fade-up co-delay-4">
          {[
            { label: "Task Completion", value: taskCompletionRate, color: "var(--green)" },
            { label: "App Conversion", value: appConversionRate, color: "var(--purple)" },
            { label: "Team Utilization", value: utilization, color: "var(--blue)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="co-glass" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
                <div className="co-progress-bar">
                  <div className="co-progress-fill" style={{ width: `${value}%`, background: color }} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color, flexShrink: 0, letterSpacing: "-0.02em" }}>{value}%</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
