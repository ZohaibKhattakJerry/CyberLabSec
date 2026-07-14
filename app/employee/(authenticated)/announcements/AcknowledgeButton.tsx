"use client";
import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function AcknowledgeButton({ announcementId, alreadyRead }: { announcementId: string; alreadyRead: boolean }) {
  const [done, setDone] = useState(alreadyRead);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
        <CheckCircle size={13} /> Acknowledged
      </div>
    );
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      style={{ gap: 5, fontSize: 12 }}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/employee/announcements/${announcementId}/acknowledge`, { method: "POST" });
        setLoading(false);
        setDone(true);
      }}
    >
      {loading ? <Loader2 size={12} className="spin" /> : <CheckCircle size={12} />}
      Acknowledge
    </button>
  );
}
