import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import TaskSubmitClient from "./TaskSubmitClient";
import TaskComments from "@/components/TaskComments";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";

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
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!task) redirect("/employee/tasks");

  // Ensure employee belongs to the assigned team
  const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
  if (employee?.teamId !== task.teamId) redirect("/employee/tasks");

  const submission = task.submissions[0] ?? null;

  // Parse comments from JSON
  let comments: any[] = [];
  try { comments = JSON.parse(task.comments || "[]"); } catch {}

  const isLocked = submission && !["Needs Revision"].includes(submission.status);

  const existingSubmission = submission
    ? {
        id: submission.id,
        status: submission.status,
        textResponse: submission.textResponse,
        linkResponse: submission.linkResponse,
        reviewerFeedback: submission.reviewerFeedback,
        version: submission.version,
        submittedAt: submission.submittedAt.toISOString(),
      }
    : null;

  // Parse checklist
  let checklist: string[] = [];
  try { checklist = JSON.parse(task.checklist || "[]"); } catch {}

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 20 }}>
      {/* Task header */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <span className={`badge ${task.priority === "Critical" ? "badge-red" : task.priority === "High" ? "badge-amber" : task.priority === "Medium" ? "badge-blue" : "badge-gray"}`}>{task.priority}</span>
          <span className="badge badge-gray">{task.status}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
            Due: <strong style={{ color: new Date(task.deadline) < new Date() ? "var(--red)" : "var(--text-primary)" }}>{format(new Date(task.deadline), "MMM d, yyyy")}</strong>
          </span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{task.title}</h1>
        {task.brief && <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{task.brief}</p>}

        {/* Checklist */}
        {checklist.length > 0 && (
          <div style={{ marginTop: 20, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Checklist</div>
            <div style={{ display: "grid", gap: 8 }}>
              {checklist.map((item, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: 15, height: 15, accentColor: "var(--purple)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submission form or locked state */}
      {isLocked ? (
        <div className="card" style={{ padding: 24, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: submission?.status === "Approved" ? "var(--green)" : "var(--purple)" }} />
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <CheckCircle size={24} color={submission?.status === "Approved" ? "var(--green)" : "var(--purple)"} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: submission?.status === "Approved" ? "var(--green)" : "var(--text-primary)" }}>
                {submission?.status === "Approved" ? "Submission Approved" : "Submission Under Review"}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                Version {submission?.version} submitted on {format(new Date(submission!.submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          
          <div style={{ display: "grid", gap: 16 }}>
            {submission?.textResponse && (
              <div>
                <label className="label">Work Summary</label>
                <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {submission.textResponse}
                </div>
              </div>
            )}
            
            {submission?.linkResponse && (
              <div>
                <label className="label">Link</label>
                <div>
                  <a href={submission.linkResponse} target="_blank" rel="noreferrer" style={{ color: "var(--purple)", fontSize: 14, textDecoration: "none" }}>
                    {submission.linkResponse}
                  </a>
                </div>
              </div>
            )}
            
            {submission?.reviewerFeedback && (
              <div style={{ marginTop: 8, padding: 16, background: "rgba(245,158,11,0.1)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Reviewer Feedback</label>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {submission.reviewerFeedback}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <TaskSubmitClient
          taskId={task.id}
          taskTitle={task.title}
          taskBrief={task.brief ?? ""}
          taskStatus={task.status}
          taskDeadline={task.deadline.toISOString()}
          existingSubmission={existingSubmission}
        />
      )}

      {/* Comments thread */}
      <TaskComments
        taskId={task.id}
        initialComments={comments}
        currentUserId={auth.sub}
        currentUserRole="employee"
      />
    </div>
  );
}
