"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, Link as LinkIcon, Type, CheckCircle, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";

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

    if (action === "Submit") {
      if (files.length === 0 && !linkResponse && !textResponse) {
        setError("You must provide either a file, a link, or a text response.");
        setLoading(false);
        return;
      }
      
      const fileExceeds = files.some(f => f.size > 50 * 1024 * 1024);
      if (fileExceeds) {
        setError("One or more files exceed the 50MB limit. Please provide a Google Drive link instead.");
        setLoading(false);
        return;
      }
    }

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
      
      if (action === "Submit") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      setDone(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: 40, border: "1px dashed var(--border-success)", borderRadius: 12, background: "rgba(34, 197, 94, 0.05)", animation: "fade-in 0.5s" }}>
        <CheckCircle size={50} color="var(--green)" style={{ margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>Mission Accomplished!</h3>
        <p style={{ color: "var(--text-secondary)" }}>Your objective report has been successfully transmitted to command.</p>
      </div>
    );
  }

  const showFile = ["File", "Any"].includes(deliverableType);
  const showText = ["Text", "Any"].includes(deliverableType);
  const showLink = ["Link", "Any"].includes(deliverableType);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "3px solid var(--blue)" }}>
        <h4 style={{ color: "var(--blue)", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Submission Guidelines</h4>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Ensure your report contains sufficient evidence. If your payload (e.g. PoC video) exceeds <strong>50MB</strong>, upload it to a secure drive and provide the <ExternalLink size={12} style={{display: "inline"}}/> Link below.
        </p>
      </div>

      {showText && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Type size={14} /> Executive Summary</label>
          <textarea 
            className="input" 
            style={{ minHeight: 120, fontSize: 14 }} 
            placeholder="Document your methodology, vulnerabilities found, and remediation steps..."
            value={textResponse}
            onChange={e => setTextResponse(e.target.value)}
          />
        </div>
      )}

      {showLink && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={14} /> Secure Drive / External Link</label>
          <input 
            type="url" 
            className="input" 
            placeholder="https://drive.google.com/... or GitHub repo"
            value={linkResponse}
            onChange={e => setLinkResponse(e.target.value)}
          />
        </div>
      )}

      {showFile && (
        <div>
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Upload size={14} /> Artifacts & Evidence</label>
          <div
            style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "rgba(255,255,255,0.01)" }}
            onClick={() => inputRef.current?.click()}
            className="hover:border-[var(--purple)] hover:bg-[rgba(168,85,247,0.02)]"
          >
            <div style={{ width: 48, height: 48, background: "rgba(168,85,247,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Upload size={24} color="var(--purple)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Drop files here or click to browse</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Supports .ZIP, .PDF, Images (Max 50MB/file)</p>
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
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ background: "var(--purple)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>FILE</div>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{f.name}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      <X size={16} className="hover:text-red" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: "14px 16px", background: "rgba(220,38,38,0.1)", color: "#fca5a5", borderRadius: 8, fontSize: 13, borderLeft: "3px solid var(--red)", display: "flex", alignItems: "center", gap: 8 }}>
          <X size={16} /> {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
        <button className="btn" style={{ background: "rgba(255,255,255,0.05)", border: "none" }} onClick={() => handleSubmit("Draft")} disabled={loading}>
          Save Draft
        </button>
        <button className="btn btn-primary" style={{ padding: "10px 24px" }} onClick={() => handleSubmit("Submit")} disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Submit Report"}
        </button>
      </div>
    </div>
  );
}
