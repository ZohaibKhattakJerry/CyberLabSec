"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Award, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

export default function CompletionDialog({ 
  isCompleted, 
  completionNotified, 
  employmentType 
}: { 
  isCompleted: boolean; 
  completionNotified: boolean; 
  employmentType: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isCompleted) {
      setOpen(true);
      if (!completionNotified) {
        // Trigger completion logic (mark notified and send email/notification)
        fetch("/api/employee/completion", { method: "POST" })
          .catch(err => console.error("Failed to trigger completion logic", err));
      }
    }
  }, [isCompleted, completionNotified]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", padding: 24 }}>
      <div className="card animate-fade-up" style={{ maxWidth: 460, width: "100%", padding: 32, textAlign: "center", position: "relative", border: "1px solid rgba(168,85,247,0.3)", boxShadow: "0 20px 60px rgba(168,85,247,0.15)" }}>
        <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
          <X size={20} />
        </button>
        
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Award size={40} color="var(--purple)" />
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Congratulations! 🎉</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          Your {employmentType} tenure with CyberLabSec has officially come to an end. We thank you for your incredible service and dedication. 
        </p>
        <div style={{ padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            You are now eligible to request your Certificate of Completion and Letter of Recommendation (LOR).
          </p>
          <button className="btn btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => { setOpen(false); router.push("/employee/documents"); }}>
            <FileText size={16} /> Request Documents
          </button>
        </div>
        
        <button className="btn btn-ghost" onClick={() => setOpen(false)} style={{ fontSize: 13 }}>Close</button>
      </div>
    </div>
  );
}
