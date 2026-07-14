"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";

export default function StartTaskButton({ taskId }: { taskId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const start = async () => {
    setLoading(true);
    await fetch(`/api/employee/tasks/${taskId}/start`, { method: "PATCH" });
    setLoading(false);
    router.push(`/employee/tasks/${taskId}`);
    router.refresh();
  };

  return (
    <button
      className="btn btn-primary btn-sm"
      style={{ gap: 5, fontSize: 12 }}
      onClick={start}
      disabled={loading}
    >
      {loading ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
      Start Task
    </button>
  );
}
