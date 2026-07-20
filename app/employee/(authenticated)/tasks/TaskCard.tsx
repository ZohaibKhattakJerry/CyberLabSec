"use client";

import { format } from "date-fns";
import { Clock, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import StartTaskButton from "./StartTaskButton";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Low: { color: "var(--green)", bg: "rgba(34,197,94,0.1)", label: "Low" },
  Medium: { color: "var(--blue)", bg: "rgba(59,130,246,0.1)", label: "Medium" },
  High: { color: "var(--amber)", bg: "rgba(245,158,11,0.1)", label: "High" },
  Critical: { color: "var(--red)", bg: "rgba(239,68,68,0.1)", label: "Critical" },
};

export default function TaskCard({ task, statusStr }: { task: any; statusStr: string }) {
  const router = useRouter();
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const isOverdue = statusStr === "Overdue";

  return (
    <div 
      className="card card-hover animate-fade-up" 
      style={{ padding: 16, cursor: "pointer", transition: "transform 0.1s", borderLeft: `3px solid ${pc.color}` }}
      onClick={() => router.push(`/employee/tasks/${task.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/employee/tasks/${task.id}`);
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.3 }}>{task.title}</div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
          {isOverdue && <span className="badge badge-red" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={10} /> Overdue</span>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: pc.bg, color: pc.color }}>{pc.label} Priority</span>
        </div>
      </div>
      
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {task.brief || "No description provided."}
      </div>



      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: isOverdue ? "var(--red)" : "var(--text-muted)", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} />
            {statusStr === "Done" ? (task.submissions[0]?.submittedAt ? format(new Date(task.submissions[0].submittedAt), "MMM d, yyyy") : format(new Date(task.deadline), "MMM d, yyyy")) : format(new Date(task.deadline), "MMM d, yyyy")}
          </div>
          {task.attachments && task.attachments !== "[]" && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
              <FileText size={12} /> Attachments
            </div>
          )}
        </div>
        
        {statusStr === "Done" && <span style={{ color: "var(--green)", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><CheckCircle size={14} /> Completed</span>}
        
        {(statusStr === "Pending" || statusStr === "Overdue" || statusStr === "Need more information") && (
          <span onClick={(e) => e.stopPropagation()}>
            <StartTaskButton taskId={task.id} />
          </span>
        )}
      </div>
    </div>
  );
}
