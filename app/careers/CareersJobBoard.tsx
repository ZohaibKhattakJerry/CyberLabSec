"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import PublicNav from "@/components/public/PublicNav";
import {
  MapPin,
  Briefcase,
  Clock,
  Shield,
  Search,
  ChevronRight,
  Terminal,
  Users,
  GraduationCap,
  Filter,
  FileText,
  X,
  CheckCircle,
  Check,
} from "lucide-react";
import { format } from "date-fns";

const CareersHeroBackground = dynamic(() => import("@/components/CareersHeroBackground"), {
  ssr: false,
});

interface Posting {
  id: string;
  title: string;
  type: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  universityRequired: boolean;
  deadline: string;
  showApplicantCount: boolean;
  publishedDate: string;
  _count: { applicants: number };
}

const getPipeline = (status: string) => {
  type Stage = { id: string; label: string; active: boolean; done: boolean };
  const allStages: Stage[] = [
    { id: "Reviewing", label: "Under Review", active: false, done: false },
    { id: "Interview", label: "Interview", active: false, done: false },
    { id: "Decision", label: "Decision", active: false, done: false },
  ];

  if (status === "Applied" || status === "Reviewing") {
    allStages[0].active = true;
  } else if (status === "Invited for Interview" || status === "Interview" || status === "Screening") {
    allStages[0].done = true;
    allStages[1].active = true;
  } else if (status === "Interview Failed" || status === "Withdrawn") {
    allStages[0].done = true;
    allStages[1].active = true;
    allStages[1].done = true;
  } else if (status === "Selected – Waiting for Approval" || status === "Final Approval" || status === "Offer" || status === "Hired" || status === "Rejected") {
    allStages[0].done = true;
    allStages[1].done = true;
    allStages[2].active = true;
    if (status === "Hired" || status === "Rejected" || status === "Offer") {
      allStages[2].done = true;
    }
  }
  return allStages;
};

export default function CareersJobBoard({ postings }: { postings: Posting[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Job" | "Internship">("All");
  const [trackOpen, setTrackOpen] = useState(false);
  const [refId, setRefId] = useState("");
  const [trackResult, setTrackResult] = useState<null | { status: string; jobTitle: string; department: string; appliedDate: string }>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);

  const filtered = postings.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);

  // Close track panel on outside click
  useEffect(() => {
    if (!trackOpen) return;
    const handler = (e: MouseEvent) => {
      if (trackRef.current && !trackRef.current.contains(e.target as Node)) {
        setTrackOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [trackOpen]);

  const daysUntilDeadline = (deadline: string) => {
    if (now === null) return null;
    const diff = new Date(deadline).getTime() - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const [talentEmail, setTalentEmail] = useState("");
  const [talentSubmitted, setTalentSubmitted] = useState(false);

  const handleTalentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talentEmail) return;
    try {
      const res = await fetch("/api/talent-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: talentEmail }),
      });
      if (res.ok) setTalentSubmitted(true);
      else {
        const data = await res.json();
        toast.error(data.error || "Failed to join talent pool");
      }
    } catch (err: any) {
      toast.error("Network error");
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refId.trim()) return;
    setTrackError("");
    setTrackResult(null);
    setTrackLoading(true);
    try {
      const res = await fetch(`/api/applications/status-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId: refId.trim().toUpperCase() })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setTrackError(d.error || "No application found with that reference ID.");
      } else {
        const d = await res.json();
        setTrackResult(d.application);
      }
    } catch {
      setTrackError("Network error. Please try again.");
    } finally {
      setTrackLoading(false);
    }
  };

  const WHY_ITEMS = [
    {
      icon: <Terminal size={18} color="var(--purple)" />,
      title: "Real Client Engagements",
      desc: "Live penetration tests from day one—not simulated labs.",
    },
    {
      icon: <Users size={18} color="var(--purple)" />,
      title: "Senior Mentorship",
      desc: "Direct guidance from experienced offensive security operators.",
    },
    {
      icon: <Shield size={18} color="var(--purple)" />,
      title: "Results-Driven Culture",
      desc: "Fully remote. We measure impact, not hours online.",
    },
  ];

  const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    "Applied":               { bg: "rgba(100,116,139,0.12)", color: "#94A3B8", label: "Applied" },
    "Reviewing":             { bg: "rgba(251,191,36,0.12)",  color: "#FBBF24", label: "Under Review" },
    "Invited for Interview": { bg: "rgba(34,211,238,0.12)",  color: "#22D3EE", label: "Interview Invite 🎉" },
    "Interview":             { bg: "rgba(34,211,238,0.12)",  color: "#22D3EE", label: "Interview" },
    "Final Approval":        { bg: "rgba(99,102,241,0.12)",  color: "#818CF8", label: "Final Approval" },
    "Offer":                 { bg: "rgba(168,85,247,0.12)",  color: "#C084FC", label: "Offer Extended" },
    "Hired":                 { bg: "rgba(34,197,94,0.12)",   color: "#4ADE80", label: "Hired ✓" },
    "Rejected":              { bg: "rgba(239,68,68,0.12)",   color: "#F87171", label: "Not Selected" },
    "Withdrawn":             { bg: "rgba(100,116,139,0.12)", color: "#94A3B8", label: "Withdrawn" },
    "PENDING":               { bg: "rgba(251,191,36,0.12)",  color: "#FBBF24", label: "Under Review" },
    "REVIEWED":              { bg: "rgba(99,102,241,0.12)",  color: "#818CF8", label: "Reviewed" },
    "SHORTLISTED":           { bg: "rgba(34,211,238,0.12)",  color: "#22D3EE", label: "Shortlisted 🎉" },
    "HIRED":                 { bg: "rgba(34,197,94,0.12)",   color: "#4ADE80", label: "Hired ✓" },
    "REJECTED":              { bg: "rgba(239,68,68,0.12)",   color: "#F87171", label: "Not Selected" },
  };

  return (
    <>
      <style>{`
        .careers-why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 820px;
          margin: 48px auto 0;
        }
        @media (max-width: 680px) {
          .careers-why-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
        .careers-why-card {
          padding: 18px;
          border-radius: 14px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(168,85,247,0.14);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
          text-align: left;
        }
        .careers-why-card:hover {
          border-color: rgba(168,85,247,0.35);
          box-shadow: 0 6px 20px rgba(168,85,247,0.12);
          transform: translateY(-2px);
        }
        .track-panel {
          position: relative;
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px 32px;
        }
        .track-box {
          border-radius: 16px;
          padding: 22px 28px;
          background: linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.06) 100%);
          border: 1px solid rgba(168,85,247,0.2);
          transition: border-color 0.2s;
        }
        .track-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .track-form {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .track-form input {
          flex: 1;
          min-width: 200px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(168,85,247,0.25);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .track-form input:focus {
          border-color: rgba(168,85,247,0.6);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
        }
        .track-result {
          margin-top: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 14px;
        }
        .jobs-section {
          max-width: 960px;
          margin: 48px auto 0;
          padding: 0 24px 80px;
        }
        .jobs-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }
        .jobs-container {
          background: var(--bg-card, rgba(13,11,20,0.7));
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.35);
        }
        .job-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 28px;
          text-decoration: none;
          transition: background 0.18s ease;
          flex-wrap: wrap;
        }
        .job-row:hover { background: rgba(168,85,247,0.05); }
        .job-row + .job-row {
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .job-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary, #fff);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .job-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          font-size: 13px;
          color: var(--text-secondary, #9CA3AF);
        }
        .job-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .job-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .job-deadline {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
        }
        .job-cta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
          color: var(--purple, #A855F7);
        }
        @media (max-width: 520px) {
          .job-row { padding: 18px 18px; }
          .job-right { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
        }
        .filters-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }
      `}</style>

      <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <PublicNav
          left={
            <Link href="/" style={{ display: "flex", alignItems: "center" }}>
              <Image src="/logo.png" alt="CyberLabSec Logo" width={180} height={40} style={{ height: 40, width: "auto", objectFit: "contain" }} priority />
            </Link>
          }
          center={
            <div style={{ display: "flex", gap: 16 }}>
              {/* Nav links can go here if needed */}
            </div>
          }
          right={
            <>
              <button
                onClick={() => setTrackOpen((v) => !v)}
                className="hide-mobile"
                style={{ fontSize: 14, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, transition: "color 0.2s", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Track Application
              </button>
              <Link href="/employee/login" className="btn btn-secondary btn-sm">
                Employee Login
              </Link>
            </>
          }
        />

        {/* ── HERO ── */}
        <section style={{ position: "relative", padding: "80px clamp(16px, 5vw, 24px) 60px", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: "800px", height: "100%",
              background: "radial-gradient(circle at center, rgba(192,132,252,.5) 0%, rgba(139,92,246,.3) 25%, rgba(109,40,217,.15) 45%, rgba(5,5,5,0) 70%)",
              zIndex: 0, pointerEvents: "none",
            }}
          />
          <CareersHeroBackground />

          <div style={{ position: "relative", zIndex: 2, maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 99, padding: "6px 14px", marginBottom: 24 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--purple)", boxShadow: "0 0 8px var(--purple)", animation: "pulse-glow 2s ease infinite", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>
                {postings.length} OPEN POSITION{postings.length !== 1 ? "S" : ""}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.1, margin: "0 0 20px" }}
            >
              Hack for a Living.{" "}
              <span style={{ color: "var(--purple)", display: "block" }}>Join CyberLabSec.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 0, lineHeight: 1.7 }}
            >
              We find what others miss — because we think like attackers.
              If you do too, there&apos;s a place for you here.
            </motion.p>

            {/* ── Why CyberLabSec — 3 cards, compact, inside hero ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="careers-why-grid"
            >
              {WHY_ITEMS.map((item) => (
                <div key={item.title} className="careers-why-card">
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(168,85,247,0.18)" }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── TRACK APPLICATION — inline, no redirect ── */}
        <div className="track-panel">
          <div className="track-box" ref={trackRef}>
            <div className="track-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(168,85,247,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={17} color="var(--purple)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Already Applied?</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Enter your Reference ID to track your application status instantly.</div>
                </div>
              </div>
              {/* Mobile toggle */}
              <button
                onClick={() => { setTrackOpen((v) => !v); setTrackResult(null); setTrackError(""); }}
                className="btn btn-secondary btn-sm"
                style={{ flexShrink: 0 }}
              >
                <Search size={13} />
                {trackOpen ? "Close" : "Track Status"}
              </button>
            </div>

            <AnimatePresence>
              {trackOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <form className="track-form" onSubmit={handleTrackSubmit}>
                    <input
                      type="text"
                      placeholder="e.g. CLS-2025-XXXXXX"
                      value={refId}
                      onChange={(e) => { setRefId(e.target.value); setTrackResult(null); setTrackError(""); }}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={trackLoading} style={{ flexShrink: 0 }}>
                      {trackLoading ? "Searching…" : "Check Status"}
                    </button>
                  </form>

                  <AnimatePresence>
                    {trackError && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="track-result" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                        {trackError}
                      </motion.div>
                    )}
                    {trackResult && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="track-result" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>{trackResult.jobTitle}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{trackResult.department}</div>
                          </div>
                          {STATUS_COLORS[trackResult.status] && (
                            <span style={{ padding: "5px 14px", borderRadius: 99, fontWeight: 700, fontSize: 13, background: STATUS_COLORS[trackResult.status].bg, color: STATUS_COLORS[trackResult.status].color }}>
                              {STATUS_COLORS[trackResult.status].label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                          Last updated: {new Date(trackResult.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>

                        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(168,85,247,0.15)" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20, textAlign: "center" }}>Application Pipeline</p>
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0 }}>
                            {getPipeline(trackResult.status).map((stage, idx, arr) => {
                              const isDecision = stage.id === "Decision";
                              const isRejectedStatus = trackResult.status === "Rejected" || trackResult.status === "Interview Failed";
                              const showRejected = isDecision && isRejectedStatus;
                              
                              let bgColor = "rgba(255,255,255,0.03)";
                              let borderColor = "rgba(255,255,255,0.1)";
                              let textColor = "var(--text-muted)";
                              let shadow = "none";

                              if (showRejected) {
                                bgColor = "var(--red, #EF4444)";
                                borderColor = "transparent";
                                textColor = "var(--red, #EF4444)";
                                shadow = "0 0 15px rgba(239,68,68,0.3)";
                              } else if (stage.done) {
                                bgColor = "linear-gradient(135deg, #22c55e, #16a34a)";
                                borderColor = "transparent";
                                textColor = "var(--green, #22C55E)";
                                shadow = "0 0 15px rgba(34,197,94,0.3)";
                              } else if (stage.active) {
                                bgColor = "linear-gradient(135deg, #a78bfa, #7c3aed)";
                                borderColor = "transparent";
                                textColor = "var(--purple-light, #C084FC)";
                                shadow = "0 0 15px rgba(168,85,247,0.3)";
                              }

                              return (
                                <div key={stage.id} style={{ display: "flex", alignItems: "center", flex: idx === arr.length - 1 ? 0 : 1 }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: bgColor, border: borderColor !== "transparent" ? `2px solid ${borderColor}` : "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: shadow }}>
                                      {(stage.done || stage.active || showRejected) && <Check size={18} color="white" strokeWidth={3} />}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: (stage.active || stage.done) ? 600 : 500, color: textColor, whiteSpace: "nowrap" }}>
                                      {showRejected ? "Not Selected" : stage.label}
                                    </span>
                                  </div>
                                  {idx < arr.length - 1 && (
                                    <div style={{ flex: 1, height: 2, background: stage.done ? "var(--green, #22C55E)" : "rgba(255,255,255,0.1)", minWidth: 20, margin: "0 8px 26px" }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── JOB BOARD ── */}
        <section className="jobs-section">
          <div className="jobs-header">
            <div style={{ width: 4, height: 26, background: "var(--purple)", borderRadius: 4, boxShadow: "0 0 10px var(--purple)", flexShrink: 0 }} />
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Open Positions</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>({filtered.length} {filtered.length === 1 ? "role" : "roles"})</span>
          </div>

          {/* Filters — only when many postings */}
          {postings.length > 3 && (
            <div className="filters-row">
              <div style={{ position: "relative", flex: "1 1 200px" }}>
                <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 34, width: "100%" }}
                  placeholder="Search by title or department…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-chips">
                {(["All", "Job", "Internship"] as const).map((t) => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={typeFilter === t ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                    style={{ flexShrink: 0 }}>
                    {t === "Internship" ? <GraduationCap size={13} /> : <Filter size={13} />} {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "72px 24px", color: "var(--text-muted)", background: "rgba(168,85,247,0.02)", borderRadius: 16, border: "1px dashed rgba(168,85,247,0.2)" }}>
              <Shield size={44} style={{ margin: "0 auto 16px", opacity: 0.25 }} />
              <p style={{ fontSize: 16, marginBottom: 8, color: "var(--text-primary)" }}>No open positions right now.</p>
              <p style={{ fontSize: 14, marginBottom: 24 }}>Leave your email and we&apos;ll notify you when we&apos;re hiring.</p>
              {talentSubmitted ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", color: "#4ADE80", padding: "10px 20px", borderRadius: 10, fontSize: 14 }}>
                  <CheckCircle size={16} /> Added to Talent Pool — we&apos;ll be in touch!
                </div>
              ) : (
                <form onSubmit={handleTalentSubmit} style={{ display: "flex", gap: 8, maxWidth: 360, margin: "0 auto" }}>
                  <input type="email" className="input" placeholder="name@example.com" required value={talentEmail} onChange={(e) => setTalentEmail(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="btn btn-primary">Notify Me</button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div layout className="jobs-container">
              <AnimatePresence mode="popLayout">
                {filtered.map((posting, i) => {
                  const days = daysUntilDeadline(posting.deadline);
                  const isUrgent = days !== null && days <= 7;
                  const deadlineColor = days !== null && days <= 3 ? "var(--red)" : isUrgent ? "var(--amber)" : "var(--text-muted)";

                  return (
                    <motion.div
                      key={posting.id} layout
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <Link href={`/careers/${posting.id}`} className="job-row">
                        {/* Left: title + meta */}
                        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                            <h3 className="job-title">{posting.title}</h3>
                            <span className={posting.type === "Job" ? "badge badge-blue" : "badge badge-amber"}>
                              {posting.type}
                            </span>
                          </div>
                          <div className="job-meta">
                            <span className="job-meta-item"><Briefcase size={13} /> {posting.department}</span>
                            <span className="job-meta-item"><MapPin size={13} /> {posting.location}</span>
                            {posting.universityRequired && (
                              <span className="job-meta-item"><GraduationCap size={13} /> Uni Required</span>
                            )}
                          </div>
                        </div>

                        {/* Right: deadline + CTA */}
                        <div className="job-right">
                          <span className="job-deadline" style={{ color: deadlineColor, fontWeight: isUrgent ? 600 : 400 }}>
                            <Clock size={13} />
                            {days !== null ? (days > 0 ? `Closes ${format(new Date(posting.deadline), "MMM d")}` : "Closed") : "…"}
                          </span>
                          <span className="job-cta">
                            View Role <ChevronRight size={15} />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
            <a href="/careers/status" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Track Application</a>
            <a href="mailto:careers@cyberlabsec.tech" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>careers@cyberlabsec.tech</a>
            <a href="https://cyberlabsec.tech" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>cyberlabsec.tech</a>
          </div>
          © {new Date().getFullYear()} CyberLabSec. All rights reserved.
        </footer>
      </div>
    </>
  );
}
