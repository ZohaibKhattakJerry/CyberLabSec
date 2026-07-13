import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { Briefcase, Users, Clock, CheckSquare, Zap, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    include: {
      team: {
        include: {
          members: { select: { id: true, name: true, designation: true, employeeCode: true, status: true } },
          tasks: {
            orderBy: { deadline: "asc" },
            include: { submissions: { where: { employeeId: auth.sub } } },
          },
        },
      },
    },
  });

  if (!employee) redirect("/employee/login");

  const daysRemaining = employee.endDate ? differenceInDays(employee.endDate, new Date()) : null;
  const now = new Date();

  // Tasks
  const allTasks = employee.team?.tasks || [];
  const completedTasks = allTasks.filter(t => t.submissions.some(s => s.status === "Approved")).length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const upcomingTasks = allTasks.filter(t => t.deadline >= now && t.submissions.length === 0).slice(0, 4);

  // Announcements
  const rawAnnouncements = await prisma.announcement.findMany({
    where: { 
      OR: [
        { scope: "Company" }, 
        { scope: "Team", teamId: employee.teamId || undefined },
        { scope: "Individual", employeeId: auth.sub },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }]
    },
    orderBy: { sentAt: "desc" },
    take: 3,
    include: { sentBy: { select: { name: true } } },
  });

  const announcements = [...rawAnnouncements].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  // Recent Activity
  const activityLogs = await prisma.activityLog.findMany({
    where: { actorId: employee.id, actorType: "Employee" },
    orderBy: { timestamp: "desc" },
    take: 4,
  });

  const isExecutive = employee.tier === "Executive" || auth.role === "admin";
  const displayTeamName = employee.team?.name || (isExecutive ? "Command Level" : "Unassigned");
  const displayRole = isExecutive ? employee.designation : employee.employmentType;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Welcome back, <span style={{ color: "var(--purple)" }}>{employee.name.split(" ")[0]}</span> 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
            {employee.designation} <span style={{ color: "var(--text-muted)" }}>•</span> {employee.employeeCode}
            {employee.employmentType === "Intern" && (
              <span style={{ marginLeft: 8, fontSize: 11, background: "rgba(168,85,247,0.15)", color: "var(--purple)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>Intern</span>
            )}
          </p>
        </div>
        
        {employee.team && (
          <div className="card" style={{ padding: "16px 24px", minWidth: 260 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
              <span style={{ color: "var(--text-secondary)" }}>Team Progress</span>
              <span style={{ color: "var(--text-primary)" }}>{progressPercent}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPercent}%`, background: "linear-gradient(90deg, var(--blue), var(--purple))", borderRadius: 4, transition: "width 1s ease-in-out" }} />
            </div>
          </div>
        )}
      </div>

      {/* Status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Briefcase size={18} color="var(--purple)" />} label="Role" value={displayRole} sub={employee.designation} />
        <StatCard icon={<Clock size={18} color="var(--amber)" />} label="Tenure" value={format(employee.startDate, "MMM yyyy")} sub={employee.employmentType === "Intern" ? (daysRemaining !== null ? `${daysRemaining} days remaining` : "—") : "Full-time Active"} />
        <StatCard icon={<Users size={18} color="var(--blue)" />} label="Squad" value={displayTeamName} sub={`${employee.team?.members.length || 0} Operatives`} />
        <StatCard icon={<CheckSquare size={18} color="var(--green)" />} label="Objectives" value={String(totalTasks)} sub={`${completedTasks} Completed`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 20 }}>
        
        {/* Quick Actions & Recent Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color="var(--amber)" /> Quick Actions
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Link href="/employee/tasks" className="btn" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", justifyContent: "flex-start", padding: "12px 16px" }}>
                <CheckSquare size={16} style={{ color: "var(--blue)" }} /> My Tasks
              </Link>
              <Link href="/employee/team" className="btn" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", justifyContent: "flex-start", padding: "12px 16px" }}>
                <Users size={16} style={{ color: "var(--purple)" }} /> Team Chat
              </Link>
              <Link href="/employee/leaderboard" className="btn" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", justifyContent: "flex-start", padding: "12px 16px" }}>
                <ShieldCheck size={16} style={{ color: "var(--green)" }} /> Leaderboard
              </Link>
              <Link href="/employee/profile" className="btn" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", justifyContent: "flex-start", padding: "12px 16px" }}>
                <Activity size={16} style={{ color: "var(--amber)" }} /> Settings
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: 24, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={16} color="var(--green)" /> Recent Activity
              </h2>
              <Link href="/employee/profile" style={{ fontSize: 12, color: "var(--purple)", textDecoration: "none" }}>View all</Link>
            </div>
            {activityLogs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No recent activity.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activityLogs.map(log => (
                  <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: log.action === "LOGIN" ? "var(--green)" : "var(--blue)" }} />
                    <div style={{ flex: 1, color: "var(--text-secondary)" }}>
                      {log.action === "LOGIN" ? "Logged in successfully" : log.action.replace(/_/g, " ")}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{format(log.timestamp, "MMM d, h:mm a")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckSquare size={16} color="var(--blue)" /> Pending Objectives
            </h2>
            <Link href="/employee/tasks" style={{ fontSize: 12, color: "var(--purple)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              All <ArrowRight size={12} />
            </Link>
          </div>
          
          {!employee.team ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{isExecutive ? "You oversee all teams. Tasks are assigned at the team level." : "You are not assigned to a team yet."}</p>
          ) : upcomingTasks.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed var(--border)" }}>
              <ShieldCheck size={32} color="var(--green)" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
              <p style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 600 }}>All caught up!</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No pending tasks in your queue.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {upcomingTasks.map((task) => {
                const days = differenceInDays(task.deadline, new Date());
                return (
                  <Link key={task.id} href={`/employee/tasks/${task.id}`} style={{ textDecoration: "none" }}>
                    <div className="card-hover" style={{ padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--border)", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                          <p style={{ fontSize: 12, color: days <= 2 ? "var(--red)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={12} /> {days > 0 ? `${days} days remaining` : "Overdue"}
                          </p>
                        </div>
                        <span className="badge badge-amber">Pending</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Announcements Full Width Banner */}
      {announcements.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color="var(--purple)" /> Latest Transmissions
            </h2>
            <Link href="/employee/announcements" style={{ fontSize: 12, color: "var(--purple)", textDecoration: "none" }}>Read all</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {announcements.map((a) => (
              <div key={a.id} style={{ borderLeft: "3px solid var(--purple)", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 8, fontWeight: 500 }}>
                  {a.isPinned && <span style={{ fontSize: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: 4, marginRight: 8, verticalAlign: "middle" }}>📌 Pinned</span>}
                  {a.message.slice(0, 100)}{a.message.length > 100 ? "..." : ""}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 16, height: 16, background: "var(--purple)", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>{a.sentBy.name[0]}</span>
                  {a.sentBy.name} <span style={{ opacity: 0.5 }}>•</span> {format(a.sentAt, "MMM d")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.03, transform: "scale(3)" }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon} {label}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}
