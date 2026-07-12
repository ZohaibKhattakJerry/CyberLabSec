import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export default async function TasksPage() {
  const auth = await getAuthFromCookies();
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
    where: { teamId: employee.teamId },
    orderBy: { deadline: "asc" },
    include: {
      submissions: {
        where: { employeeId: auth.sub }
      }
    }
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>My Tasks</h1>
      
      {tasks.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <FileText size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)" }}>No tasks currently assigned to your team.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {tasks.map((task) => {
            const isSubmitted = task.submissions.length > 0;
            const daysLeft = differenceInDays(task.deadline, new Date());
            const isOverdue = daysLeft < 0 && !isSubmitted;

            return (
              <Link key={task.id} href={`/employee/tasks/${task.id}`} style={{ textDecoration: "none" }}>
                <div className="card card-hover" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{task.title}</h3>
                      {isSubmitted ? (
                        <span className="badge badge-green">Submitted</span>
                      ) : isOverdue ? (
                        <span className="badge badge-purple">Overdue</span>
                      ) : (
                        <span className="badge badge-amber">Pending</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>{task.brief.slice(0, 100)}...</p>
                    <div style={{ display: "flex", gap: 6, fontSize: 12, color: isOverdue ? "var(--purple)" : "var(--text-muted)", alignItems: "center" }}>
                      <Clock size={12} />
                      Due: {format(task.deadline, "MMM d, yyyy")} ({daysLeft > 0 ? `${daysLeft} days left` : isOverdue ? 'Late' : 'Due today'})
                    </div>
                  </div>
                  <ChevronRight color="var(--text-muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
