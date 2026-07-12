import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, FileText, UploadCloud, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import TaskSubmitClient from "./TaskSubmitClient";

export default async function TaskDetailsPage({ params }: { params: Promise<{ taskId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  const resolvedParams = await params;

  const task = await prisma.task.findUnique({
    where: { id: resolvedParams.taskId },
    include: {
      team: true,
      submissions: {
        where: { employeeId: auth.sub },
      },
    },
  });

  if (!task) redirect("/employee/tasks");

  // Ensure employee belongs to the assigned team
  const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
  if (employee?.teamId !== task.teamId) redirect("/employee/tasks");

  const submission = task.submissions[0];

  return (
    <div className="animate-fade-up">
      <Link href="/employee/tasks" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, marginBottom: 24 }} className="hover:text-white">
        <ChevronLeft size={16} /> Back to Tasks
      </Link>

      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{task.title}</h1>
              <span className="badge badge-purple">{task.team.name}</span>
            </div>
            <p style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Clock size={14} /> Due: {format(task.deadline, "PPP 'at' p")}
            </p>
          </div>
          {submission ? (
            <div className="badge badge-green" style={{ padding: "6px 12px", fontSize: 13 }}>
              <CheckCircle size={14} /> Submitted
            </div>
          ) : (
            <div className="badge badge-amber" style={{ padding: "6px 12px", fontSize: 13 }}>
              Pending Submission
            </div>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 12, border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="var(--purple)" /> Operational Brief
          </h3>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{task.brief}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <UploadCloud size={20} color="var(--purple)" /> Report Submission
        </h2>
        {submission ? (
          <div style={{ textAlign: "center", padding: 40, border: "1px dashed var(--border-success)", borderRadius: 12, background: "rgba(34, 197, 94, 0.05)" }}>
            <CheckCircle size={40} color="var(--green)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>Submission Received</h3>
            <p style={{ color: "var(--text-secondary)" }}>Your report was securely submitted on {format(submission.submittedAt, "PPP 'at' p")}.</p>
          </div>
        ) : (
          <TaskSubmitClient taskId={task.id} />
        )}
      </div>
    </div>
  );
}
