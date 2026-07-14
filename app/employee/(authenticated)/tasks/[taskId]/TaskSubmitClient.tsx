"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Link as LinkIcon, CheckCircle, AlertTriangle, FileText, ChevronLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTS = [".zip", ".pdf", ".docx"];

interface Submission {
  id: string;
  status: string;
  textResponse: string | null;
  linkResponse: string | null;
  reviewerFeedback: string | null;
  version: number;
  submittedAt: string;
}

interface TaskSubmitClientProps {
  taskId: string;
  taskTitle: string;
  taskBrief: string;
  taskStatus: string;
  taskDeadline: string;
  existingSubmission: Submission | null;
}

export default function TaskSubmitClient({
  taskId,
  taskTitle,
  taskBrief,
  taskStatus,
  taskDeadline,
  existingSubmission,
}: TaskSubmitClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isChangesRequested = existingSubmission?.status === "Needs Revision";
  const version = existingSubmission ? existingSubmission.version + 1 : 1;

  const validateFile = (f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
      return "Invalid file type. Only ZIP, PDF, and DOCX files are accepted.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${(f.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 50 MB.`;
    }
    return null;
  };

  const handleFileChange = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFileError("");
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) { toast.error("Work summary is required"); return; }
    if (!file && !link.trim()) {
      toast.error("Please attach a file or provide a link to your work.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("taskId", taskId);
    formData.append("summary", summary.trim());
    if (link.trim()) formData.append("link", link.trim());
    if (file) formData.append("file", file);
    formData.append("version", String(version));

    try {
      const res = await fetch("/api/employee/portal/tasks/submit", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
      toast.success("Work submitted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 0", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={36} color="var(--green)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Submission Received</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
          Your work for <strong>{taskTitle}</strong> has been submitted (v{version}) and is awaiting review.
          You&apos;ll be notified when the team reviews your submission.
        </p>
        <Link href="/employee/tasks" className="btn btn-primary" style={{ display: "inline-flex" }}>
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }} className="animate-fade-up">
      <div style={{ marginBottom: 24 }}>
        <Link href="/employee/tasks" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
          <ChevronLeft size={14} /> Back to Tasks
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Submit Work</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>v{version} · {taskTitle}</p>
      </div>

      {/* Changes requested banner */}
      {isChangesRequested && existingSubmission?.reviewerFeedback && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={18} color="var(--amber)" />
            <span style={{ fontWeight: 700, color: "var(--amber)" }}>Changes Requested</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>{existingSubmission.reviewerFeedback}</p>
        </div>
      )}

      {/* Task info */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Task Brief</div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{taskBrief || "No brief provided."}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
        {/* Work Summary */}
        <div>
          <label className="label label-required">Work Summary</label>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Describe what you did, key findings, methodology, and any important notes.</p>
          <textarea
            className="input"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Summarize your work, approach, and key findings..."
            rows={6}
            required
            style={{ minHeight: 140 }}
          />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>{summary.length} characters</div>
        </div>

        {/* File Upload */}
        <div>
          <label className="label">Attach File <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(ZIP, PDF, DOCX — max 50 MB)</span></label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${isDragging ? "var(--purple)" : fileError ? "var(--red)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "32px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? "rgba(168,85,247,0.05)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}
          >
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <FileText size={20} color="var(--purple)" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 6px" }}>
                  Drag & drop your file here, or <span style={{ color: "var(--purple)", fontWeight: 600 }}>browse</span>
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>ZIP, PDF, DOCX · Max 50 MB</p>
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".zip,.pdf,.docx,application/zip,application/pdf"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
          />

          {fileError && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "var(--red)", fontSize: 13 }}>
              <AlertTriangle size={14} /> {fileError}
            </div>
          )}

          {/* Helper note */}
          <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              📁 <strong>File larger than 50 MB?</strong> Upload it to your Google Drive / cloud storage, set link sharing to &quot;Anyone with the link&quot;, and paste the link below.
            </p>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="label">Work Link <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(repo, report, shared drive, etc.)</span></label>
          <div style={{ position: "relative" }}>
            <LinkIcon size={16} style={{ position: "absolute", left: 14, top: 13, color: "var(--text-muted)" }} />
            <input
              className="input"
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://github.com/... or https://drive.google.com/..."
              style={{ paddingLeft: 42 }}
            />
          </div>
        </div>

        {/* Validation note */}
        <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle size={14} color="var(--text-muted)" />
          At least one of (file or link) is required to submit.
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Link href="/employee/tasks" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: 160 }}>
            {submitting ? (
              <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</>
            ) : (
              `Submit Work${version > 1 ? ` (v${version})` : ""}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
