"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send, CheckCircle, FileText, Loader2, Link as LinkIcon, Download, UploadCloud, File, Image as ImageIcon, Briefcase, Calendar, AlertTriangle, MessageSquare, Zap, ShieldAlert, Box, Star } from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Low: { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: Box },
  Medium: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: Star },
  High: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: Zap },
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: ShieldAlert },
};

export default function TaskDetailClient({ task, employeeId }: { task: any; employeeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [textResponse, setTextResponse] = useState("");
  const [linkResponse, setLinkResponse] = useState("");
  const [files, setFiles] = useState<{name: string, url: string}[]>([]);
  
  const currentSubmission = task.submissions[0];
  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const Icon = pCfg.icon;

  useEffect(() => {
    if (currentSubmission?.status === "Approved") {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#3b82f6', '#34d399'] });
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
        toast.success("Task submitted successfully! Awaiting review.");
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
    <div style={{ animation: "fadeIn 0.5s ease", paddingBottom: 60, maxWidth: 1000, margin: "0 auto" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .back-btn { display: inline-flex; items-center: center; gap: 8px; color: #9ca3af; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid transparent; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.05em; }
        .back-btn:hover { color: #fff; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.1); transform: translateX(-4px); }
        
        .detail-card { background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: clamp(20px, 5vw, 40px); margin-bottom: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; overflow: hidden; }
        .detail-card::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #6366f1, #a855f7); }
        
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }
        
        .brief-box { font-size: 15px; line-height: 1.7; color: #d1d5db; white-space: pre-wrap; padding: 24px; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        
        .form-input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px 18px; color: #fff; font-size: 15px; outline: none; transition: 0.3s; }
        .form-input:focus { border-color: #a855f7; box-shadow: 0 0 0 4px rgba(168,85,247,0.1); background: rgba(168,85,247,0.03); }
        
        .upload-area { border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; padding: 32px 20px; text-align: center; cursor: pointer; transition: 0.3s; background: rgba(255,255,255,0.02); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .upload-area:hover { border-color: #a855f7; background: rgba(168,85,247,0.05); }
        
        .btn-submit { display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; border-radius: 16px; padding: 16px 32px; font-size: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(168,85,247,0.3); width: 100%; }
        .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(168,85,247,0.4); filter: brightness(1.1); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      <button className="back-btn" onClick={() => router.push("/employee/tasks")}>
        <ArrowLeft size={14} /> Back to Kanban
      </button>

      <div className="detail-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{task.title}</h1>
          
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="tag" style={{ background: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.color}40` }}>
              <Icon size={14} /> {task.priority} Priority
            </div>
            <div className="tag" style={{ background: "rgba(255,255,255,0.05)", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Calendar size={14} /> Due {format(new Date(task.deadline), "MMM d, yyyy")}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Task Brief & Objectives</h3>
          <div className="brief-box">
            {task.brief}
          </div>
        </div>

        {attachments.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Attachments ({attachments.length})</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {attachments.map((att: any, i: number) => (
                <a key={i} href={att.url || att.data} download={att.name} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px", borderRadius: 12, color: "#a5b4fc", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "0.2s" }}
                   onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "#a5b4fc"; }}
                   onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  <Download size={16} /> {att.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUBMISSION AREA */}
      {!currentSubmission || currentSubmission.status === "Pending" || currentSubmission.status === "Need more information" ? (
        <div className="detail-card" style={{ padding: "clamp(20px, 5vw, 40px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={20} color="#a855f7" />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Submit Your Work</h2>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Provide details, links, or file uploads to complete this task.</p>
            </div>
          </div>

          {currentSubmission?.status === "Need more information" && (
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: 20, marginBottom: 24, display: "flex", gap: 16 }}>
              <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ color: "#ef4444", fontWeight: 800, fontSize: 14, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Revision Required</h4>
                <p style={{ color: "#fca5a5", fontSize: 15, margin: 0, lineHeight: 1.5 }}>{currentSubmission.reviewerFeedback}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#d1d5db", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><MessageSquare size={14} color="#a855f7"/> Text Response / Notes</label>
              <textarea 
                className="form-input" 
                rows={5} 
                value={textResponse} 
                onChange={e => setTextResponse(e.target.value)} 
                placeholder="Describe your findings, work done, or provide a written response..."
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#d1d5db", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><LinkIcon size={14} color="#3b82f6"/> Submission Link (Optional)</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="url" 
                  className="form-input" 
                  style={{ paddingLeft: 44 }} 
                  value={linkResponse} 
                  onChange={e => setLinkResponse(e.target.value)} 
                  placeholder="https://github.com/your-pr-or-figma-link"
                />
                <LinkIcon size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#d1d5db", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><UploadCloud size={14} color="#34d399"/> Upload Files (Optional)</label>
              <label className="upload-area">
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UploadCloud size={24} color="#9ca3af" />
                </div>
                <div>
                  <span style={{ color: "#a5b4fc", fontWeight: 700 }}>Click to browse</span> <span style={{ color: "#6b7280" }}>or drag and drop</span>
                </div>
                <div style={{ fontSize: 12, color: "#4b5563" }}>PDF, Images, ZIP up to 50MB</div>
                <input type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
              </label>

              {files.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#d8b4fe", padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                      <File size={14} /> {f.name}
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", marginLeft: 4, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%" }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-submit" style={{ marginTop: 16 }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} /> Submit Task For Review</>}
            </button>
          </form>
        </div>
      ) : (
        <div className="detail-card" style={{ padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
            background: currentSubmission.status === "Approved" ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)",
            boxShadow: `0 0 40px ${currentSubmission.status === "Approved" ? "rgba(52,211,153,0.3)" : "rgba(245,158,11,0.3)"}`
          }}>
            {currentSubmission.status === "Approved" ? <CheckCircle size={40} color="#34d399" /> : <Clock size={40} color="#f59e0b" />}
          </div>
          
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
            {currentSubmission.status === "Approved" ? "Task Approved! 🎉" : "Task Under Review"}
          </h2>
          
          <p style={{ color: "#9ca3af", fontSize: 16, maxWidth: 500, lineHeight: 1.6, margin: "0 auto 32px" }}>
            {currentSubmission.status === "Approved" 
              ? "Excellent work! Your manager has reviewed and approved your submission. Points and badges have been awarded." 
              : "Your submission has been received and is waiting for your manager to review it. You will be notified once it's graded."}
          </p>
          
          <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 600, textAlign: "left" }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Your Submission Details</h4>
            
            {currentSubmission.textResponse && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Text Response</div>
                <div style={{ fontSize: 14, color: "#e5e7eb", whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>{currentSubmission.textResponse}</div>
              </div>
            )}
            
            {currentSubmission.linkResponse && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Link</div>
                <a href={currentSubmission.linkResponse} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "#a855f7", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={14} /> {currentSubmission.linkResponse}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
