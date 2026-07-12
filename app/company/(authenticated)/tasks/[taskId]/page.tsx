import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, CheckCircle, Clock, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import SubmissionReviewClient from "./SubmissionReviewClient";

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

  return (
    <div className="animate-fade-up">
      <Link href="/company/tasks" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, marginBottom: 24 }} className="hover:text-white">
        <ChevronLeft size={16} /> Back to Tasks
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24, alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{task.title}</h1>
                <span className="badge badge-purple">{task.team.name}</span>
              </div>
            </div>
            
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Operational Brief</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              {task.brief}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
