import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
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

  // If already approved or pending (and not needing revision), show read-only success state
  const isLocked = submission && !["Needs Revision"].includes(submission.status);

  if (isLocked) {
    const { CheckCircle } = await import("lucide-react");
    const { format } = await import("date-fns");
    return (
      <div className="animate-fade-up" style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ textAlign: "center", padding: 60, border: "1px dashed var(--border-success)", borderRadius: 16, background: "rgba(34,197,94,0.04)" }}>
          <CheckCircle size={48} color="var(--green)" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--green)", marginBottom: 8 }}>
            {submission.status === "Approved" ? "Submission Approved" : "Submission Received — Awaiting Review"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            <strong>{task.title}</strong> · v{submission.version} submitted on{" "}
            {format(submission.submittedAt, "PPP 'at' p")}
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <TaskSubmitClient
      taskId={task.id}
      taskTitle={task.title}
      taskBrief={task.brief ?? ""}
      taskStatus={task.status}
      taskDeadline={task.deadline.toISOString()}
      existingSubmission={existingSubmission}
    />
  );
}
