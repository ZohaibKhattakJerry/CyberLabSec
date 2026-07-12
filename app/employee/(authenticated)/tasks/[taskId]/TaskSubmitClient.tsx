"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";

export default function TaskSubmitClient({ taskId }: { taskId: string }) {
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

    try {
      const res = await fetch("/api/employee/tasks/submit", { method: "POST", body: fd });
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
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>Processing Submission...</h3>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "rgba(255,255,255,0.01)" }}
        onClick={() => inputRef.current?.click()}
        className="hover:border-[var(--purple)] hover:bg-[rgba(168,85,247,0.02)]"
      >
        <Upload size={32} color="var(--purple)" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Click to upload report files</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Support for PDF, ZIP, Images, DOCX (Max 50MB/file)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Attached Files</h4>
          <div style={{ display: "grid", gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 14 }}>
                <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={16} className="hover:text-white" />
                </button>
              </div>
            ))}
          </div>

          {error && <p style={{ fontSize: 13, color: "var(--purple-light)", marginTop: 16 }}>{error}</p>}

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ minWidth: 200, padding: "12px 24px" }}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</> : "Submit Final Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
