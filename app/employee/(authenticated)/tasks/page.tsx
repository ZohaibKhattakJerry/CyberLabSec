import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, AlertTriangle } from "lucide-react";
import TaskCard from "./TaskCard";
import { differenceInDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  const employee = await prisma.employee.findUnique({
    where: { id: auth.sub },
    select: { teamId: true }
  });

  if (!employee?.teamId) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <AlertTriangle size={40} color="var(--amber)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Team Assigned</h2>
        <p style={{ color: "var(--text-secondary)" }}>You haven&apos;t been assigned to a team yet. Tasks will appear here once you are.</p>
      </div>
    );
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { teamId: employee.teamId },
        { assigneeId: auth.sub }
      ]
    },
    orderBy: { deadline: "asc" },
    include: {
      submissions: {
        where: { employeeId: auth.sub }
      }
    }
  }).catch(() => []);

  const getStatus = (task: any) => {
    if (task.submissions.length === 0) {
      const daysLeft = differenceInDays(new Date(task.deadline), new Date());
      return daysLeft < 0 ? "Overdue" : "Pending";
    }
    const status = task.submissions[0].status;
    if (status === "Approved") return "Done";
    if (status === "Need more information") return "Need more information";
    return "In Review";
  };

  const serializedTasks = tasks.map((t: any) => ({
    ...t,
    deadline: t.deadline.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    submissions: t.submissions.map((s: any) => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
    })),
  }));

  const pendingTasks = serializedTasks.filter(t => getStatus(t) === "Pending" || getStatus(t) === "Overdue");
  const inReviewTasks = serializedTasks.filter(t => getStatus(t) === "In Review");
  const revisionTasks = serializedTasks.filter(t => getStatus(t) === "Need more information");
  const doneTasks = serializedTasks.filter(t => getStatus(t) === "Done");

  const renderColumn = (title: string, columnTasks: any[], badgeColor: string) => (
    <div style={{ flex: 1, minWidth: 250, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
        <span className={`badge ${badgeColor}`}>{columnTasks.length}</span>
      </div>
      
      {columnTasks.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>No tasks</div>
      ) : (
        columnTasks.map(task => (
          <TaskCard key={task.id} task={task} statusStr={getStatus(task)} />
        ))
      )}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>My Tasks</h1>
      
      {serializedTasks.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <FileText size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)" }}>No tasks currently assigned to your team.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, paddingBottom: 16, minHeight: 400 }}>
          {renderColumn("To-Do", pendingTasks, "badge-gray")}
          {renderColumn("In Review", inReviewTasks, "badge-amber")}
          {renderColumn("Need more information", revisionTasks, "badge-red")}
          {renderColumn("Done", doneTasks, "badge-green")}
        </div>
      )}
    </div>
  );
}
