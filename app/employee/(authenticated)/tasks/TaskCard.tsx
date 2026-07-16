"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import StartTaskButton from "./StartTaskButton";

export default function TaskCard({ task, statusStr }: { task: unknown; statusStr: string }) {
  const router = useRouter();

  return (
    <div 
      className="card card-hover" 
      style={{ padding: 16, cursor: "pointer", transition: "transform 0.1s" }}
      onClick={() => router.push(`/employee/tasks/${task.id}`)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{task.title}</div>
        {statusStr === "Overdue" && <span className="badge badge-red" style={{ fontSize: 10 }}>Overdue</span>}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
        {task.brief ? `${task.brief.slice(0, 80)}...` : ""}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, fontSize: 11, color: statusStr === "Overdue" ? "var(--red)" : "var(--text-muted)", alignItems: "center" }}>
          <Clock size={12} />
          {statusStr === "Done" ? (task.submissions[0]?.submittedAt ? format(new Date(task.submissions[0].submittedAt), "MMM d, yyyy") : format(new Date(task.deadline), "MMM d, yyyy")) : format(new Date(task.deadline), "MMM d, yyyy")}
        </div>
        {(statusStr === "Pending" || statusStr === "Overdue") && (
          <span onClick={(e) => e.stopPropagation()}>
            <StartTaskButton taskId={task.id} />
          </span>
        )}
      </div>
    </div>
  );
}
