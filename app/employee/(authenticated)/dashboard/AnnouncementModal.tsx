"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Check, Loader2, X } from "lucide-react";

export default function AnnouncementModal({ 
  announcements 
}: { 
  announcements: { id: string, title: string, content: string, sentBy: { name: string } }[] 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (!announcements || announcements.length === 0) return null;
  if (currentIndex >= announcements.length) return null;

  const current = announcements[currentIndex];

  const handleAcknowledge = async () => {
    setLoading(true);
    await fetch(`/api/employee/announcements/${current.id}/acknowledge`, { method: "POST" });
    setLoading(false);
    if (currentIndex + 1 < announcements.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      startTransition(() => router.refresh());
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card animate-fade-up" style={{ width: "100%", maxWidth: 500, overflow: "hidden", border: "1px solid rgba(168,85,247,0.3)", boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.1)" }}>
        
        {/* Header */}
        <div style={{ padding: "24px", background: "linear-gradient(180deg, rgba(168,85,247,0.1) 0%, transparent 100%)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }}>
            <BellRing size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="badge badge-purple" style={{ fontSize: 11 }}>Important Announcement</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                {currentIndex + 1} of {announcements.length}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{current.title}</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>From: {current.sentBy.name}</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 24px", fontSize: 15, lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
          {current.content}
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", justifyContent: "flex-end" }}>
          <button 
            className="btn btn-primary" 
            onClick={handleAcknowledge}
            disabled={loading}
            style={{ width: "100%", padding: "12px", fontSize: 15, fontWeight: 600, display: "flex", justifyContent: "center", gap: 8 }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <><Check size={18} /> I have read and acknowledge this</>}
          </button>
        </div>
      </div>
    </div>
  );
}
