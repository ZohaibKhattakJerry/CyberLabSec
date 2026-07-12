"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Link as LinkIcon, Type } from "lucide-react";

export default function TaskSubmitClient({ taskId, deliverableType }: { taskId: string, deliverableType: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [textResponse, setTextResponse] = useState("");
  const [linkResponse, setLinkResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (action: "Draft" | "Submit") => {
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("taskId", taskId);
    fd.append("action", action);
    fd.append("textResponse", textResponse);
    fd.append("linkResponse", linkResponse);
    files.forEach(f => fd.append("files", f));

    try {
      const res = await fetch("/api/employee/portal/tasks/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setDone(true);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: 40, border: "1px dashed var(--border-success)", borderRadius: 12, background: "rgba(34, 197, 94, 0.05)" }}>
        <Loader2 size={40} color="var(--green)" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>Processing...</h3>
      </div>
    );
  }

  const showFile = ["File", "Any"].includes(deliverableType);
  const showText = ["Text", "Any"].includes(deliverableType);
  const showLink = ["Link", "Any"].includes(deliverableType);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {showText && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Type size={14} /> Text Response</label>
          <textarea 
            className="input" 
            style={{ minHeight: 120 }} 
            placeholder="Write your findings or report here..."
            value={textResponse}
            onChange={e => setTextResponse(e.target.value)}
          />
        </div>
      )}

      {showLink && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={14} /> Link Submission</label>
          <input 
            type="url" 
            className="input" 
            placeholder="https://github.com/... or Google Docs link"
            value={linkResponse}
            onChange={e => setLinkResponse(e.target.value)}
          />
        </div>
      )}

      {showFile && (
        <div>
          <label className="label">File Attachments</label>
          <div
            style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "rgba(255,255,255,0.01)" }}
            onClick={() => inputRef.current?.click()}
            className="hover:border-[var(--purple)] hover:bg-[rgba(168,85,247,0.02)]"
          >
            <Upload size={24} color="var(--purple)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Click to upload files</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Support for PDF, ZIP, Images (Max 50MB/file)</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
            />
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "grid", gap: 8 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{f.name}</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      <X size={14} className="hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ padding: 12, background: "rgba(220,38,38,0.1)", color: "#fca5a5", borderRadius: 8, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <button className="btn btn-secondary" onClick={() => handleSubmit("Draft")} disabled={loading}>
          Save Draft
        </button>
        <button className="btn btn-primary" onClick={() => handleSubmit("Submit")} disabled={loading}>
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Submit for Review"}
        </button>
      </div>
    </div>
  );
}
