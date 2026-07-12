"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";

export default function TaskSubmitButton({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (files.length === 0) { setError("Please attach at least one file."); return; }
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("taskId", taskId);
    files.forEach(f => fd.append("files", f));
    const res = await fetch("/api/portal/tasks/submit", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Submission failed"); return; }
    setDone(true);
    setTimeout(() => { setOpen(false); setDone(false); setFiles([]); }, 1500);
  };

  if (done) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 13 }}>
        <CheckCircle size={16} /> Submitted!
      </div>
    );
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <Upload size={14} /> Submit
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Submit Task</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18 }}>{taskTitle}</p>

            <div
              style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={24} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Click to upload files</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>PDF, images, ZIP, DOCX — max 50MB each</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
              />
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 6, fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{f.name}</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p style={{ fontSize: 12, color: "var(--purple-light)", marginTop: 12 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOpen(false)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</> : "Submit Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
