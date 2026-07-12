"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileDown, CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function SubmissionReviewClient({ submission }: { submission: any }) {
  const [status, setStatus] = useState(submission.status);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(submission.aiSummary || "");
  const [generatingAI, setGeneratingAI] = useState(false);

  let files = [];
  try { files = JSON.parse(submission.files); } catch {}

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/tasks/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setStatus(newStatus);
      toast.success(`Submission marked as ${newStatus}`);
    } catch (error) {
      toast.error("Error updating submission");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch(`/api/company/tasks/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      setAiSummary(data.summary);
      toast.success("AI Summary generated");
    } catch (error) {
      toast.error("Error generating AI summary");
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="card" style={{ padding: 24, border: status === "Approved" ? "1px solid var(--border-success)" : status === "Revision" ? "1px solid var(--border-accent)" : "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--purple)" }}>
            {submission.employee.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{submission.employee.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{submission.employee.designation} · {format(new Date(submission.submittedAt), "MMM d, yyyy h:mm a")}</div>
          </div>
        </div>
        
        <div>
          {status === "Approved" && <span className="badge badge-green">Approved</span>}
          {status === "Revision" && <span className="badge badge-amber">Revision Requested</span>}
          {status === "Pending" && <span className="badge badge-gray">Pending Review</span>}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>Attached Files</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {files.map((file: string, idx: number) => {
            const name = file.split("/").pop() || file;
            return (
              <a key={idx} href={file} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, color: "var(--text-primary)", textDecoration: "none" }} className="hover:border-[var(--purple)]">
                <FileDown size={14} color="var(--purple)" /> {name}
              </a>
            );
          })}
        </div>
      </div>

      <div style={{ background: "rgba(168,85,247,0.03)", border: "1px solid var(--border-subtle)", padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} color="var(--purple)" /> AI Content Analysis
          </h4>
          {!aiSummary && (
            <button onClick={handleGenerateAISummary} disabled={generatingAI} className="btn btn-secondary btn-sm">
              {generatingAI ? <Loader2 size={14} className="animate-spin" /> : "Run Analysis"}
            </button>
          )}
        </div>
        {aiSummary ? (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{aiSummary}</p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No AI analysis generated yet. Run analysis to scan report contents.</p>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <button onClick={() => handleUpdateStatus("Approved")} disabled={loading || status === "Approved"} className="btn" style={{ background: status === "Approved" ? "var(--green)" : "rgba(34,197,94,0.1)", color: status === "Approved" ? "#fff" : "var(--green)", border: "none" }}>
          <CheckCircle size={16} /> Approve
        </button>
        <button onClick={() => handleUpdateStatus("Revision")} disabled={loading || status === "Revision"} className="btn" style={{ background: status === "Revision" ? "var(--amber)" : "rgba(245,158,11,0.1)", color: status === "Revision" ? "#fff" : "var(--amber)", border: "none" }}>
          <XCircle size={16} /> Request Revision
        </button>
      </div>
    </div>
  );
}
