"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Search, Loader2, CheckCircle, ChevronLeft, Briefcase, Calendar, AlertCircle } from "lucide-react";
import PublicNav from "@/components/public/PublicNav";

export default function StatusClient() {
  const [refId, setRefId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  // Poll for live status updates if we have a valid refId and data showing
  useEffect(() => {
    if (!data || !refId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/applications/status-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referenceId: refId.trim().toUpperCase() })
        });
        const resData = await res.json();
        if (res.ok && resData.application) {
          setData(resData.application);
        }
      } catch {
        // ignore network errors on background poll
      }
    }, 5000); // Check every 5 seconds for real-time feel
    return () => clearInterval(interval);
  }, [data, refId]);


  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refId.trim()) return;
    
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/applications/status-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId: refId.trim().toUpperCase() })
      });
      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "Failed to check status");
      } else {
        setData(resData.application);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const getPipeline = (status: string) => {
    type Stage = { id: string; label: string; active: boolean; done: boolean };
    const allStages: Stage[] = [
      { id: "Reviewing", label: "Under Review", active: false, done: false },
      { id: "Interview", label: "Interview", active: false, done: false },
      { id: "Decision", label: "Decision", active: false, done: false },
    ];

    if (status === "Reviewing") {
      allStages[0].active = true;
    } else if (status === "Invited for Interview") {
      allStages[0].done = true;
      allStages[1].active = true;
    } else if (status === "Interview Failed") {
      allStages[0].done = true;
      allStages[1].active = true;
      allStages[1].done = true;
    } else if (status === "Selected – Waiting for Approval" || status === "Hired" || status === "Rejected") {
      allStages[0].done = true;
      allStages[1].done = true;
      allStages[2].active = true;
      if (status !== "Selected – Waiting for Approval") {
        allStages[2].done = true;
      }
    }

    return allStages;
  };

  const isRejected = data?.status === "Rejected" || data?.status === "Interview Failed";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <PublicNav
        left={
          <Link href="/careers" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text-secondary)", fontSize: 14 }}>
            <ChevronLeft size={16} /> <span className="hide-mobile-text">Back to Careers</span>
          </Link>
        }
      />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Application Status</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>Enter your Reference ID to track your application.</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form className="flex-mobile-col" onSubmit={handleCheck} style={{ display: "flex", gap: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className={`input${error ? " input-error" : ""}`}
                style={{ paddingLeft: 44, height: 48, fontSize: 16, textTransform: "uppercase" }}
                placeholder="APP-XXXXXX"
                aria-label="Reference ID"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 48, padding: "0 24px" }} disabled={loading || !refId.trim()}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Check Status"}
            </button>
          </form>

          {error && (
            <p style={{ color: "var(--red)", fontSize: 14, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <AnimatePresence>
            {data && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 40, overflow: "hidden" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--purple)", fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Briefcase size={14} /> {data.department}
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{data.jobTitle}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
                        <Calendar size={13} /> Applied on {new Date(data.appliedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 20 }}>Current Status</h3>
                    
                    <div style={{ overflowX: "auto", paddingBottom: 20 }}>
                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
                        <div style={{ position: "absolute", top: 12, left: 24, right: 24, height: 2, background: "var(--border)", zIndex: 0 }} />
                        
                        {getPipeline(data.status).map((stage) => {
                          const isDecision = stage.id === "Decision";
                          const showRejected = isDecision && isRejected;
                          const bgColor = showRejected ? "var(--amber)" : stage.done ? "var(--green)" : stage.active ? "var(--purple)" : "var(--bg-primary)";
                          const borderColor = showRejected ? "var(--amber)" : stage.done ? "var(--green)" : stage.active ? "var(--purple)" : "var(--border)";
                          return (
                            <div key={stage.id} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 80 }}>
                              <div style={{ 
                                width: 24, height: 24, borderRadius: "50%", 
                                background: bgColor,
                                border: `2px solid ${borderColor}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: stage.active ? "0 0 12px rgba(168,85,247,0.3)" : stage.done ? "0 0 8px rgba(34,197,94,0.3)" : "none",
                                color: "var(--bg-primary)"
                              }}>
                                {(stage.active || stage.done) && <CheckCircle size={14} strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: (stage.active || stage.done) ? 600 : 400, color: showRejected ? "var(--amber)" : stage.done ? "var(--green)" : stage.active ? "var(--text-primary)" : "var(--text-muted)", textAlign: "center" }}>
                                {showRejected ? "Not Selected" : stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {data.status === "Invited for Interview" && (
                    <div style={{ marginTop: 24, padding: 16, background: "rgba(34,197,94,0.1)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.2)" }}>
                      <p style={{ color: "var(--green)", fontSize: 14, margin: 0, fontWeight: 500 }}>
                        Your interview invitation has been sent. Please check your email and complete the assessment before the link expires.
                      </p>
                    </div>
                  )}

                  {isRejected && (
                    <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                        Thank you for your interest in CyberLabSec. After reviewing your application, we have decided to move forward with other candidates for this role. We wish you the best in your career.
                      </p>
                    </div>
                  )}

                  {data.status === "Interview Failed" && (
                    <div style={{ marginTop: 24, padding: 16, background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
                      <p style={{ color: "var(--red)", fontSize: 14, margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                        Unfortunately, you did not pass the technical assessment. Thank you for your time and effort. We wish you the best in your future endeavors.
                      </p>
                    </div>
                  )}

                  {data.status === "Selected – Waiting for Approval" && (
                    <div style={{ marginTop: 24, padding: 20, background: "rgba(34,197,94,0.08)", borderRadius: 12, border: "1px solid rgba(34,197,94,0.2)" }}>
                      <p style={{ color: "var(--green)", fontSize: 15, margin: "0 0 8px 0", fontWeight: 700 }}>🎉 Interview Passed!</p>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                        Congratulations! You have cleared the technical interview. Your profile is now under final review by the hiring team. You will be notified via email once the decision is made.
                      </p>
                    </div>
                  )}

                  {data.status === "Hired" && (
                    <div style={{ marginTop: 24, padding: 20, background: "rgba(34,197,94,0.1)", borderRadius: 12, border: "1px solid rgba(34,197,94,0.3)" }}>
                      <p style={{ color: "var(--green)", fontSize: 15, margin: "0 0 8px 0", fontWeight: 700 }}>🚀 You&apos;ve Been Hired!</p>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                        Welcome to the CyberLabSec team! Please check your email for onboarding details and your official offer letter.
                      </p>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
