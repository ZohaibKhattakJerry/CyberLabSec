import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { Briefcase, GraduationCap, Users, Clock, CheckSquare } from "lucide-react";

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
            where: { deadline: { gte: new Date() } },
            orderBy: { deadline: "asc" },
            take: 5,
            include: { submissions: { where: { employeeId: auth.sub } } },
          },
        },
      },
    },
  });

  if (!employee) redirect("/employee/login");

  const daysRemaining = employee.endDate ? differenceInDays(employee.endDate, new Date()) : null;

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
    take: 5,
    include: { sentBy: { select: { name: true } } },
  });

  const announcements = [...rawAnnouncements].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  const isExecutive = employee.tier === "Executive" || auth.role === "admin";
  const displayTeamName = employee.team?.name || (isExecutive ? "Command Level" : "Unassigned");
  const displayRole = isExecutive ? employee.designation : employee.employmentType;
  const displaySubRole = isExecutive ? "Executive Leadership" : employee.designation;

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Welcome back, {employee.name.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>{employee.designation} · {employee.employeeCode}</p>
      </div>

      {/* Status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Briefcase size={18} color="var(--purple)" />} label="Role" value={displayRole} sub={displaySubRole} />
        <StatCard icon={<Clock size={18} color="var(--amber)" />} label="Start Date" value={format(employee.startDate, "MMM d, yyyy")} sub={employee.employmentType === "Intern" ? (daysRemaining !== null ? `${daysRemaining} days remaining` : "—") : "Full-time"} />
        <StatCard icon={<Users size={18} color="var(--blue)" />} label="Team" value={displayTeamName} sub={`${employee.team?.members.length || 0} members`} />
        <StatCard icon={<CheckSquare size={18} color="var(--green)" />} label="Active Tasks" value={String(employee.team?.tasks.length || 0)} sub="assigned to your team" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Tasks */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Upcoming Tasks</h2>
          {!employee.team ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{isExecutive ? "You oversee all teams. Tasks are assigned at the team level." : "You are not assigned to a team yet."}</p>
          ) : employee.team.tasks.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No upcoming tasks.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {employee.team.tasks.map((task) => {
                const submitted = task.submissions.length > 0;
                const days = differenceInDays(task.deadline, new Date());
                return (
                  <div key={task.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                        <p style={{ fontSize: 12, color: days <= 2 ? "var(--purple)" : "var(--text-muted)" }}>{days > 0 ? `${days}d left` : "Overdue"}</p>
                      </div>
                      <span className={submitted ? "badge badge-green" : "badge badge-amber"}>{submitted ? "Submitted" : "Pending"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Announcements</h2>
          {announcements.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No announcements yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} style={{ borderLeft: "2px solid var(--purple)", paddingLeft: 12 }}>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {a.isPinned && <span style={{ fontSize: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>📌 Pinned</span>}
                    {a.message.slice(0, 120)}{a.message.length > 120 ? "..." : ""}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{a.sentBy.name} · {format(a.sentAt, "MMM d")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}
