import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import SubmissionReviewClient from "./SubmissionReviewClient";
import TaskComments from "@/components/TaskComments";

export default async function AdminTaskReviewPage({ params }: { params: Promise<{ taskId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") redirect("/company/login");

  const resolvedParams = await params;
  const task = await prisma.task.findUnique({
    where: { id: resolvedParams.taskId },
    include: {
      team: { select: { name: true } },
      submissions: {
        include: {
          employee: { select: { id: true, name: true, employeeCode: true, designation: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!task) redirect("/company/tasks");

  // Fetch activity logs for this task
  const activityLogs = await prisma.activityLog.findMany({
    where: { metadata: { contains: resolvedParams.taskId } },
    orderBy: { timestamp: "asc" },
    take: 20,
  });

  const taskActivity = activityLogs.filter(log => {
    try { const m = JSON.parse(log.metadata || "{}"); return m.taskId === resolvedParams.taskId; } catch { return false; }
  });

  // Parse checklist
  let checklist: string[] = [];
  try { checklist = JSON.parse(task.checklist || "[]"); } catch {}

  let comments: unknown[] = [];
  try { comments = JSON.parse(task.comments || "[]"); } catch {}

  const ACTION_LABELS: Record<string, string> = {
    TASK_CREATED: "Task created",
    TASK_STARTED: "Task started",
    TASK_SUBMITTED: "Submission received",
    TASK_APPROVED: "Submission approved",
    TASK_CHANGES_REQUESTED: "Changes requested",
    TASK_STATUS_CHANGED: "Status updated",
  };

  return (
    <div className="animate-fade-up">
      <Link href="/company/tasks" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, marginBottom: 24 }} className="hover:text-white">
        <ChevronLeft size={16} /> Back to Tasks
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24, alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{task.title}</h1>
                <span className="badge badge-purple">{task.team.name}</span>
              </div>
            </div>
            
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Operational Brief</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              {task.brief}
            </p>

            {/* Checklist */}
            {checklist.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Checklist</h3>
                <div style={{ display: "grid", gap: 6 }}>
                  {checklist.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-secondary)" }}>
                      <CheckCircle size={14} color="var(--purple)" style={{ flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Employee Submissions ({task.submissions.length})</h2>
            {task.submissions.length > 0 && (
              <a href={`/api/company/tasks/${task.id}/bulk-download`} target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                <FileText size={14} /> Bulk Download
              </a>
            )}
          </div>
          
          <div style={{ display: "grid", gap: 16 }}>
            {task.submissions.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                No reports submitted yet.
              </div>
            ) : (
              task.submissions.map((sub) => (
                <SubmissionReviewClient key={sub.id} submission={sub} />
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 24, position: "sticky", top: 80 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Task Details</h3>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Deadline</p>
                <p style={{ fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color="var(--purple)" /> {format(task.deadline, "PPP p")}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Created At</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{format(task.createdAt, "PPP")}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Status</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--purple)" }}>{task.status}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Priority</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{task.priority}</p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {taskActivity.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Activity Timeline</h3>
              <div style={{ display: "grid", gap: 0 }}>
                {taskActivity.map((log, i) => {
                  let meta: unknown = {};
                  try { meta = JSON.parse(log.metadata || "{}"); } catch {}
                  const label = ACTION_LABELS[log.action] || log.action.replace(/_/g, " ").toLowerCase();
                  return (
                    <div key={log.id} style={{ display: "flex", gap: 12, paddingBottom: i < taskActivity.length - 1 ? 14 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--purple)", border: "1px solid rgba(168,85,247,0.5)", flexShrink: 0, marginTop: 4 }} />
                        {i < taskActivity.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(168,85,247,0.15)", marginTop: 3 }} />}
                      </div>
                      <div style={{ paddingBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{label}</div>
                        {meta.employeeName && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>by {meta.employeeName}</div>}
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{format(new Date(log.timestamp), "MMM d, h:mm a")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments thread */}
          <TaskComments
            taskId={task.id}
            initialComments={comments}
            currentUserId={auth.sub}
            currentUserRole="admin"
          />
        </div>
      </div>
    </div>
  );
}
