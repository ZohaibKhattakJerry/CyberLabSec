"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send, CheckCircle, FileText, Loader2, Link as LinkIcon, Download, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

export default function TaskDetailClient({ task, employeeId }: { task: any; employeeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [textResponse, setTextResponse] = useState("");
  const [linkResponse, setLinkResponse] = useState("");
  const [files, setFiles] = useState<{name: string, url: string}[]>([]);
  
  const currentSubmission = task.submissions[0];

  useEffect(() => {
    if (currentSubmission?.status === "Approved") {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [currentSubmission?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textResponse && !linkResponse && files.length === 0) {
      toast.error("Please provide a text response, a link, or upload a file.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/tasks/${task.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textResponse, linkResponse, files }),
      });
      if (res.ok) {
        toast.success("Task submitted successfully!");
        router.refresh();
      } else {
        toast.error("Failed to submit task.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFiles(prev => [...prev, { name: file.name, url: ev.target!.result as string }]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  let attachments = [];
  try {
    if (task.attachments && task.attachments !== "[]") {
      attachments = JSON.parse(task.attachments);
    }
  } catch (e) {}

  return (
    <div className="animate-fade-up">
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => router.push("/employee/tasks")}>
        <ArrowLeft size={14} /> Back to Tasks
      </button>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{task.title}</h1>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          <span style={{ fontWeight: 600, color: "var(--purple)" }}>Priority: {task.priority}</span>
          <span>Due: {format(new Date(task.deadline), "PPP")}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap", marginBottom: 24 }}>
          {task.brief}
        </div>

        {attachments.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Attachments</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {attachments.map((att: any, i: number) => (
                <a key={i} href={att.url || att.data} download={att.name} className="btn btn-ghost btn-sm" style={{ border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
                  <Download size={14} /> {att.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {!currentSubmission || currentSubmission.status === "Pending" || currentSubmission.status === "Need more information" ? (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Submit Task</h2>
          {currentSubmission?.status === "Need more information" && (
            <div style={{ background: "rgba(239,68,68,0.1)", padding: 12, borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16, color: "var(--red)", fontSize: 14 }}>
              <strong>Revision Required:</strong> {currentSubmission.reviewerFeedback}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label className="label">Text Response / Notes</label>
              <textarea 
                className="input" 
                rows={4} 
                value={textResponse} 
                onChange={e => setTextResponse(e.target.value)} 
                placeholder="Describe your findings or work done..."
              />
            </div>
            <div>
              <label className="label">Submission Link (optional)</label>
              <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <LinkIcon size={16} style={{ position: "absolute", left: 12, color: "var(--text-muted)" }} />
                <input 
                  type="url" 
                  className="input" 
                  style={{ paddingLeft: 36 }} 
                  value={linkResponse} 
                  onChange={e => setLinkResponse(e.target.value)} 
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
            <div>
              <label className="label">Upload Files (optional)</label>
              <input type="file" className="input" multiple onChange={handleFileUpload} />
              {files.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {files.map((f, i) => (
                    <div key={i} className="badge badge-purple" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <FileText size={12} /> {f.name}
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: 4 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifySelf: "flex-start", marginTop: 8 }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />} 
              Submit Task
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <CheckCircle size={56} color="var(--green)" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Task Submitted</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: 15 }}>Your submission is currently <strong>{currentSubmission.status}</strong>.</p>
          {currentSubmission.status === "Approved" && (
            <div style={{ background: "rgba(34,197,94,0.1)", padding: "12px 24px", borderRadius: 8, display: "inline-block", color: "var(--green)", fontWeight: 700, fontSize: 16 }}>
              Great job! Approved by reviewer.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
