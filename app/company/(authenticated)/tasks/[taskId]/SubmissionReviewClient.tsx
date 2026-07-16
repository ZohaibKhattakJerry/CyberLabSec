"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileDown, CheckCircle, XCircle, Loader2, Sparkles, _Send, Type, Link as LinkIcon, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function SubmissionReviewClient({ submission }: { submission: unknown }) {
  const [status, setStatus] = useState(submission.status);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(submission.aiSummary || "");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [feedback, setFeedback] = useState(submission.reviewerFeedback || "");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  let files: string[] = [];
  try { files = JSON.parse(submission.files || "[]"); } catch {}

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === "Needs Revision" && !feedback) {
      setShowFeedbackInput(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/company/tasks/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id, status: newStatus, feedback }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setStatus(newStatus);
      setShowFeedbackInput(false);
      toast.success(`Submission marked as ${newStatus}`);
    } catch {
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
    } catch {
      toast.error("Error generating AI summary");
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="card" style={{ padding: 24, border: status === "Approved" ? "1px solid var(--border-success)" : status === "Needs Revision" ? "1px solid var(--border-accent)" : "1px solid var(--border)" }}>
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
          {status === "Needs Revision" && <span className="badge badge-amber">Revision Requested</span>}
          {status === "Pending" && <span className="badge badge-gray">Pending Review</span>}
          {status === "Draft" && <span className="badge badge-gray" style={{ opacity: 0.6 }}>Draft</span>}
        </div>
      </div>

      <div style={{ display: "grid", gap: 20, marginBottom: 20 }}>
        {submission.textResponse && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><Type size={14} /> Text Response</h4>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {submission.textResponse}
            </div>
          </div>
        )}

        {submission.linkResponse && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={14} /> Link Submission</h4>
            <a href={submission.linkResponse} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "10px 14px", background: "rgba(147, 51, 234, 0.1)", color: "var(--purple)", borderRadius: 8, fontSize: 13, textDecoration: "none", wordBreak: "break-all" }}>
              {submission.linkResponse}
            </a>
          </div>
        )}

        {files.length > 0 && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>Attached Files</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {files.map((file: string, idx: number) => {
                const name = file.split("/").pop() || file;
                return (
                  <a key={idx} href={`/api/company/tasks/files?path=${encodeURIComponent(file)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, color: "var(--text-primary)", textDecoration: "none" }} className="hover:border-[var(--purple)]">
                    <FileDown size={14} color="var(--purple)" /> {name}
                  </a>
                );
              })}
            </div>
          </div>
        )}
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

      {(status === "Needs Revision" || feedback) && !showFeedbackInput && (
        <div style={{ padding: 16, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><MessageSquare size={14} /> Reviewer Feedback</h4>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{feedback}</p>
        </div>
      )}

      {showFeedbackInput && (
        <div style={{ marginBottom: 20 }}>
          <label className="label">Revision Feedback / Comments</label>
          <textarea className="input" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Explain what needs to be changed..." />
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFeedbackInput(false)}>Cancel</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus("Needs Revision")} disabled={loading || !feedback}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Send Feedback"}
            </button>
          </div>
        </div>
      )}

      {status !== "Draft" && !showFeedbackInput && (
        <div style={{ display: "flex", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <button onClick={() => handleUpdateStatus("Approved")} disabled={loading || status === "Approved"} className="btn" style={{ background: status === "Approved" ? "var(--green)" : "rgba(34,197,94,0.1)", color: status === "Approved" ? "#fff" : "var(--green)", border: "none" }}>
            <CheckCircle size={16} /> Approve
          </button>
          <button onClick={() => setShowFeedbackInput(true)} disabled={loading || status === "Needs Revision"} className="btn" style={{ background: status === "Needs Revision" ? "var(--amber)" : "rgba(245,158,11,0.1)", color: status === "Needs Revision" ? "#fff" : "var(--amber)", border: "none" }}>
            <XCircle size={16} /> Request Revision
          </button>
        </div>
      )}
    </div>
  );
}
