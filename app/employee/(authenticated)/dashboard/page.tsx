import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import {
  Briefcase, Users, Clock, CheckSquare, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Bell, Star,
} from "lucide-react";
import Link from "next/link";
import AnnouncementModal from "./AnnouncementModal";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    include: {
      team: {
        include: {
          members: {
            select: { id: true, name: true, designation: true, employeeCode: true, status: true },
          },
          tasks: {
            orderBy: { deadline: "asc" },
            include: { submissions: { where: { employeeId: auth.sub } } },
          },
        },
      },
      badges: { orderBy: { awardedAt: "desc" }, take: 3 },
      pointTransactions: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { points: true, reason: true, createdAt: true },
      },
    },
  });

  if (!employee) redirect("/employee/login");

  // Leaderboard rank
  const allEmployees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: { id: true, points: true, monthlyPoints: true },
    orderBy: { monthlyPoints: "desc" },
  });
  const myMonthlyRank = allEmployees.findIndex((e) => e.id === employee.id) + 1;
  
//   const myAllTimeRank = allTimeRanked.findIndex((e) => e.id === employee.id) + 1;

  const daysRemaining = employee.endDate
    ? differenceInDays(employee.endDate, new Date())
    : null;
  const now = new Date();

  // Tasks
  const allTasks = employee.team?.tasks || [];
  const completedTasks = allTasks.filter((t) =>
    t.submissions.some((s) => s.status === "Approved")
  ).length;
  const totalTasks = allTasks.length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const upcomingTasks = allTasks
    .filter((t) => t.deadline >= now && t.submissions.length === 0)
    .slice(0, 4);
  const overdueTasks = allTasks.filter(
    (t) => t.deadline < now && !t.submissions.some((s) => s.status === "Approved")
  ).length;

  // Announcements
  const rawAnnouncements = await prisma.announcement.findMany({
    where: {
      OR: [
        { scope: "Company" },
        { scope: "Team", teamId: employee.teamId || undefined },
        { scope: "Individual", employeeId: auth.sub },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    orderBy: { sentAt: "desc" },
    take: 3,
    include: { sentBy: { select: { name: true } } },
  });

  const announcements = [...rawAnnouncements].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  // Unread dots: which announcements has this employee NOT yet acknowledged
  const myReceipts = await prisma.announcementReadReceipt.findMany({
    where: { employeeId: auth.sub },
    select: { announcementId: true },
  });
  const readSet = new Set(myReceipts.map((r) => r.announcementId));
  const unreadAnnouncements = announcements.filter((a) => !readSet.has(a.id));
  const unreadAnnouncementCount = unreadAnnouncements.length;

  const activityLogs = await prisma.activityLog.findMany({
    where: { actorId: employee.id, actorType: "Employee" },
    orderBy: { timestamp: "desc" },
    take: 4,
  });

  const isExecutive = employee.tier === "Executive" || auth.role === "admin";
  const displayTeamName =
    employee.team?.name || (isExecutive ? "Command Level" : "Unassigned");

  const BADGE_ICONS: Record<string, string> = {
    FirstTask: "🎯",
    TenTasks: "🔟",
    PerfectMonth: "⭐",
    TopPerformer: "🏆",
  };

  return (
    <div>
      <AnnouncementModal announcements={unreadAnnouncements} />
      {/* Welcome Banner */}
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            Welcome back,{" "}
            <span style={{ color: "var(--purple)" }}>
              {employee.name.split(" ")[0]}
            </span>{" "}
            👋
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>
              {employee.designation}
            </strong>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            {employee.employeeCode}
            {employee.employmentType === "Intern" && (
              <span
                style={{
                  fontSize: 11,
                  background: "rgba(168,85,247,0.15)",
                  color: "var(--purple)",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                Intern
              </span>
            )}
            {overdueTasks > 0 && (
              <span
                style={{
                  fontSize: 11,
                  background: "rgba(239,68,68,0.12)",
                  color: "var(--red)",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                ⚠ {overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {employee.team && (
          <div className="card" style={{ padding: "16px 24px", minWidth: 240 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Team Progress
              </span>
              <span style={{ color: "var(--text-primary)" }}>
                {progressPercent}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background:
                    "linear-gradient(90deg, var(--blue), var(--purple))",
                  borderRadius: 4,
                  transition: "width 1s ease-in-out",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 8,
              }}
            >
              {completedTasks} / {totalTasks} tasks completed
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={<Briefcase size={18} color="var(--purple)" />}
          label="Role"
          value={employee.designation}
          sub={
            employee.employmentType === "Intern"
              ? "Internship"
              : `${employee.tier} Employee`
          }
        />
        <StatCard
          icon={<Clock size={18} color="var(--amber)" />}
          label="Tenure"
          value={format(employee.startDate, "MMM yyyy")}
          sub={
            employee.employmentType === "Intern" && daysRemaining !== null
              ? `${daysRemaining} days remaining`
              : "Full-time Active"
          }
        />
        <StatCard
          icon={<Users size={18} color="var(--blue)" />}
          label="Squad"
          value={displayTeamName}
          sub={`${employee.team?.members.length || 0} Employees`}
        />
        <StatCard
          icon={<CheckSquare size={18} color="var(--green)" />}
          label="Objectives"
          value={String(totalTasks)}
          sub={`${completedTasks} Completed`}
        />
        <StatCard
          icon={<Trophy size={18} color="var(--amber)" />}
          label="Points"
          value={String(employee.points)}
          sub={`#${myMonthlyRank} this month`}
          link="/employee/leaderboard"
        />
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Actions */}
          <div className="card" style={{ padding: 24 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Zap size={16} color="var(--amber)" /> Quick Actions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                { href: "/employee/tasks", icon: <CheckSquare size={15} style={{ color: "var(--blue)" }} />, label: "My Tasks" },
                { href: "/employee/team", icon: <Users size={15} style={{ color: "var(--purple)" }} />, label: "Team Chat" },
                { href: "/employee/leaderboard", icon: <Trophy size={15} style={{ color: "var(--amber)" }} />, label: "Leaderboard" },
                { href: "/employee/announcements", icon: <Bell size={15} style={{ color: "var(--green)" }} />, label: "Announcements" },
                { href: "/employee/profile", icon: <Activity size={15} style={{ color: "var(--text-muted)" }} />, label: "My Profile" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="btn"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    justifyContent: "flex-start",
                    padding: "11px 14px",
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  {action.icon} {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Points & Badges */}
          {(employee.points > 0 || employee.badges.length > 0) && (
            <div className="card" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Star size={16} color="var(--amber)" /> Performance
                </h2>
                <Link
                  href="/employee/leaderboard"
                  style={{
                    fontSize: 12,
                    color: "var(--purple)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Leaderboard <ArrowRight size={12} />
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--amber)",
                    }}
                  >
                    #{myMonthlyRank}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Monthly
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--text-primary)",
                    }}
                  >
                    {employee.monthlyPoints}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    This Month
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--purple)",
                    }}
                  >
                    {employee.points}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    All Time
                  </div>
                </div>
              </div>

              {employee.badges.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {employee.badges.map((b) => (
                    <div
                      key={b.id}
                      title={b.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 10px",
                        background: "rgba(168,85,247,0.1)",
                        border: "1px solid rgba(168,85,247,0.2)",
                        borderRadius: 20,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {BADGE_ICONS[b.type] || "🏅"}
                      </span>
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {employee.pointTransactions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Recent Earnings
                  </div>
                  {employee.pointTransactions.map((tx, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 12,
                        paddingBottom: 6,
                        borderBottom:
                          i < employee.pointTransactions.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                        marginBottom:
                          i < employee.pointTransactions.length - 1 ? 6 : 0,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        {tx.reason.replace("Task approved: ", "").split(" (")[0]}
                      </span>
                      <span
                        style={{
                          color: "var(--green)",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        +{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Activity size={16} color="var(--green)" /> Recent Activity
              </h2>
            </div>
            {activityLogs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                No recent activity.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 13,
                      paddingBottom: 10,
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background:
                          log.action === "LOGIN"
                            ? "var(--green)"
                            : log.action.includes("TASK")
                            ? "var(--purple)"
                            : "var(--blue)",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.action === "LOGIN"
                        ? "Logged in"
                        : log.action
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>
                      {format(log.timestamp, "MMM d")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tasks */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckSquare size={16} color="var(--blue)" /> Pending Objectives
            </h2>
            <Link
              href="/employee/tasks"
              style={{
                fontSize: 12,
                color: "var(--purple)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              All <ArrowRight size={12} />
            </Link>
          </div>

          {!employee.team ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: "1px dashed var(--border)",
              }}
            >
              <Users size={28} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                {isExecutive
                  ? "You oversee all teams."
                  : "Not assigned to a team yet."}
              </p>
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: "1px dashed var(--border)",
              }}
            >
              <ShieldCheck
                size={32}
                color="var(--green)"
                style={{ margin: "0 auto 12px", opacity: 0.8 }}
              />
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                All caught up!
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                No pending tasks in your queue.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {upcomingTasks.map((task) => {
                const days = differenceInDays(task.deadline, new Date());
                const isOverdue = days < 0;
                return (
                  <Link
                    key={task.id}
                    href={`/employee/tasks/${task.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="card-hover"
                      style={{
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 10,
                        border: `1px solid ${isOverdue ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                        transition: "all 0.2s",
                        borderLeft: `3px solid ${isOverdue ? "var(--red)" : "var(--purple)"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {task.title}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: isOverdue ? "var(--red)" : days <= 2 ? "var(--amber)" : "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={12} />
                            {isOverdue
                              ? `Overdue by ${Math.abs(days)} days`
                              : days === 0
                              ? "Due today"
                              : `${days} days remaining`}
                          </p>
                        </div>
                        <span className={`badge ${isOverdue ? "badge-red" : "badge-amber"}`}>
                          {isOverdue ? "Overdue" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Bell size={16} color="var(--purple)" /> Latest Announcements
              {unreadAnnouncementCount > 0 && (
                <span style={{
                  background: "var(--amber)", color: "#000",
                  fontSize: 10, fontWeight: 800, padding: "1px 6px",
                  borderRadius: 10, lineHeight: 1.6,
                }}>{unreadAnnouncementCount} new</span>
              )}
            </h2>
            <Link
              href="/employee/announcements"
              style={{
                fontSize: 12,
                color: "var(--purple)",
                textDecoration: "none",
              }}
            >
              Read all
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {announcements.map((a) => (
              <div
                key={a.id}
                style={{
                  borderLeft: `3px solid ${!readSet.has(a.id) ? "var(--amber)" : "var(--purple)"}`,
                  padding: "12px 16px",
                  background: !readSet.has(a.id) ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
                  borderRadius: "0 8px 8px 0",
                  position: "relative",
                }}
              >
                {!readSet.has(a.id) && (
                  <span style={{
                    position: "absolute", top: 10, right: 10,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--amber)",
                    boxShadow: "0 0 6px rgba(245,158,11,0.6)",
                  }} />
                )}
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                    marginBottom: 8,
                    fontWeight: 500,
                  }}
                >
                  {a.isPinned && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "rgba(245,158,11,0.15)",
                        color: "#f59e0b",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginRight: 8,
                        verticalAlign: "middle",
                      }}
                    >
                      📌 Pinned
                    </span>
                  )}
                  {a.message.slice(0, 100)}
                  {a.message.length > 100 ? "…" : ""}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      background: "var(--purple)",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {a.sentBy.name[0]}
                  </span>
                  {a.sentBy.name}{" "}
                  <span style={{ opacity: 0.5 }}>·</span>{" "}
                  {format(a.sentAt, "MMM d")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  link?: string;
}) {
  const content = (
    <div
      className="card"
      style={{
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        cursor: link ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "var(--text-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {icon} {label}
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </div>
  );

  return link ? (
    <Link href={link} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  ) : (
    content
  );
}
