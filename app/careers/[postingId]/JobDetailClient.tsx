"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft, MapPin, Briefcase, Clock, GraduationCap,
  Share2, MessageCircle, Copy, CheckCircle, DollarSign,
  Calendar, Users, Zap, BookOpen, Gift, ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import PublicNav from "@/components/public/PublicNav";
import { format } from "date-fns";

interface Posting {
  id: string;
  title: string;
  type: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  niceToHave: string | null;
  whatYouGain: string | null;
  stipend: string | null;
  duration: string | null;
  weeklyHours: number | null;
  experienceLevel: string;
  openings: number;
  universityRequired: boolean;
  deadline: string;
  showApplicantCount: boolean;
  publishedDate: string;
  _count: { applicants: number };
}

export default function JobDetailClient({ posting }: { posting: Posting }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [postedDays, setPostedDays] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const diff = new Date(posting.deadline).getTime() - Date.now();
    setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const pDiff = Date.now() - new Date(posting.publishedDate).getTime();
    setPostedDays(Math.max(0, Math.floor(pDiff / (1000 * 60 * 60 * 24))));
  }, [posting]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + window.location.pathname);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(window.location.origin + window.location.pathname);
    const title = encodeURIComponent(posting.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, "_blank");
  };

  const handleWhatsApp = () => {
    const url = window.location.origin + window.location.pathname;
    const text = encodeURIComponent(`🔐 ${posting.title} — CyberLabSec\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
  const isClosed = daysLeft !== null && daysLeft <= 0;

  const parseLines = (text: string) =>
    text.split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[-•*]\s*/, "").trim());

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <>
      <style>{`
        .jd-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(168,85,247,0.35), rgba(255,255,255,0.04), transparent);
          margin: 0 0 44px;
        }
        .jd-section { margin-bottom: 48px; }
        .jd-section-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .jd-req-item {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.65;
          transition: color 0.18s;
        }
        .jd-req-item:hover { color: var(--text-primary); }
        .jd-req-item:last-child { border-bottom: none; }
        .jd-step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          position: relative;
          padding-bottom: 22px;
        }
        .jd-step:last-child { padding-bottom: 0; }
        .jd-step::before {
          content: '';
          position: absolute;
          left: 13px;
          top: 28px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, rgba(168,85,247,0.25), transparent);
        }
        .jd-step:last-child::before { display: none; }
        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 400;
        }
        .meta-pill.urgent {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.22);
          color: var(--red);
          font-weight: 600;
        }
        .apply-bar-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 26px;
          background: linear-gradient(135deg, #A855F7, #7C3AED);
          color: #fff;
          border-radius: 13px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s;
          box-shadow: 0 4px 22px rgba(168,85,247,0.38);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .apply-bar-btn:hover {
          box-shadow: 0 8px 36px rgba(168,85,247,0.55);
          transform: translateY(-1px);
        }
        .apply-bar-btn:active { transform: scale(0.98); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        {/* Nav */}
        <PublicNav
          className="job-detail-nav"
          left={
            <Link
              href="/careers"
              style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--text-secondary)", fontSize: 14, whiteSpace: "nowrap", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              <ChevronLeft size={16} />
              <span className="hide-mobile-text">Open Positions</span>
            </Link>
          }
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleCopy} title="Copy link" style={{ padding: "8px" }}>
                {copied ? <CheckCircle size={16} color="var(--green)" /> : <Copy size={16} />}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleLinkedIn} title="Share on LinkedIn" style={{ padding: "8px" }}>
                <Share2 size={16} />
              </button>
            </div>
          }
        />

        <div className="job-detail-content" style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(32px, 5vw, 56px) clamp(16px, 5vw, 24px) 120px" }}>

          {/* ── HERO HEADER ── */}
          <motion.div variants={stagger} initial="hidden" animate="visible">

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span className={`badge ${posting.type === "Job" ? "badge-blue" : "badge-amber"}`}>{posting.type}</span>
              <span className="badge badge-gray">{posting.department}</span>
              {posting.universityRequired && (
                <span className="badge badge-purple"><GraduationCap size={11} /> University Required</span>
              )}
              {daysLeft !== null && isUrgent && <span className="badge badge-red">⚠ Closes in {daysLeft} days</span>}
              {daysLeft !== null && isClosed && <span className="badge badge-red">Closed</span>}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 22, lineHeight: 1.1 }}
            >
              {posting.title}
            </motion.h1>

            {/* Meta pills */}
            <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
              <span className="meta-pill"><MapPin size={13} /> {posting.location}</span>
              <span className="meta-pill"><Briefcase size={13} /> {posting.experienceLevel !== "Any" ? `${posting.experienceLevel} Level` : "Any Experience"}</span>
              {posting.duration && <span className="meta-pill"><Calendar size={13} /> {posting.duration}</span>}
              {posting.weeklyHours && <span className="meta-pill"><Clock size={13} /> {posting.weeklyHours}h/week</span>}
              {posting.openings > 1 && <span className="meta-pill"><Users size={13} /> {posting.openings} openings</span>}
              <span className={`meta-pill${isUrgent ? " urgent" : ""}`}>
                <Clock size={13} />
                {isClosed ? "Closed" : `Closes ${format(new Date(posting.deadline), "MMM d, yyyy")}`}
              </span>
            </motion.div>

            {/* Stipend */}
            {posting.stipend && (
              <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 12, marginBottom: 40 }}>
                <DollarSign size={16} color="var(--green)" />
                <span style={{ fontWeight: 700, color: "var(--green)" }}>{posting.stipend}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/ month{posting.type === "Internship" ? " stipend" : " salary"}</span>
              </motion.div>
            )}
          </motion.div>

          <div className="jd-divider" />

          {/* ── BODY ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>

            {/* About */}
            <div className="jd-section">
              <h2 className="jd-section-title"><BookOpen size={16} color="var(--purple)" /> About This Role</h2>
              <div style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {posting.description}
              </div>
            </div>

            {/* Requirements */}
            <div className="jd-section">
              <h2 className="jd-section-title"><Zap size={16} color="var(--purple)" /> Requirements</h2>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {parseLines(posting.requirements).map((req, i) => (
                  <li key={i} className="jd-req-item">
                    <CheckCircle size={14} color="var(--purple)" style={{ marginTop: 4, flexShrink: 0 }} />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nice to Have */}
            {posting.niceToHave && (
              <div className="jd-section">
                <h2 className="jd-section-title"><CheckCircle size={16} color="var(--blue)" /> Nice to Have</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {parseLines(posting.niceToHave).map((item, i) => (
                    <li key={i} className="jd-req-item">
                      <CheckCircle size={14} color="var(--blue)" style={{ marginTop: 4, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What You Gain */}
            {posting.whatYouGain && (
              <div className="jd-section">
                <h2 className="jd-section-title"><Gift size={16} color="var(--amber)" /> What You'll Gain</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {parseLines(posting.whatYouGain).map((item, i) => (
                    <li key={i} className="jd-req-item">
                      <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>🎁</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hiring Process */}
            <div className="jd-section">
              <h2 className="jd-section-title">🔬 Hiring Process</h2>
              <div style={{ paddingLeft: 4 }}>
                {[
                  { step: "1", label: "Application Review", desc: "We review your profile, security links, and motivation within 3 business days." },
                  { step: "2", label: "AI Skill Scoring", desc: "Automated screening assesses technical alignment based on your profile and answers." },
                  { step: "3", label: "AI Technical Interview", desc: "A timed, remote interview with written + MCQ questions across core security domains." },
                  { step: "4", label: "Final Selection", desc: "CEO/founder review. Offer sent to selected candidates." },
                ].map((s) => (
                  <div key={s.step} className="jd-step">
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(168,85,247,0.1)", border: "1.5px solid rgba(168,85,247,0.38)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "var(--purple)", flexShrink: 0 }}>{s.step}</div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>⏱</span>
                <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>Decisions within <strong>7 days</strong> of interview. All candidates receive a response.</span>
              </div>
            </div>

            {/* Share */}
            <div className="card" style={{ padding: "22px 24px", textAlign: "center", border: "1px solid var(--border-accent)", marginTop: 8 }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 14 }}>Know someone who'd be a great fit?</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={handleCopy}>
                  {copied ? <CheckCircle size={14} color="var(--green)" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button className="btn btn-secondary" onClick={handleLinkedIn}><Share2 size={14} /> LinkedIn</button>
                <button className="btn btn-secondary" onClick={handleWhatsApp}><MessageCircle size={14} /> WhatsApp</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── STICKY APPLY BAR ── */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="job-detail-apply-bar"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "rgba(4,3,10,0.92)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(168,85,247,0.14)",
            boxShadow: "0 -6px 30px rgba(0,0,0,0.45), 0 -1px 0 rgba(168,85,247,0.08)",
            padding: "14px clamp(16px,5vw,24px)",
            zIndex: 100,
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{posting.title}</div>
              {postedDays !== null && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {postedDays === 0 ? "Posted today" : `Posted ${postedDays}d ago`}
                  {posting.showApplicantCount && ` · ${posting._count.applicants} applicant${posting._count.applicants !== 1 ? "s" : ""}`}
                  {posting.stipend && ` · ${posting.stipend}/mo`}
                </div>
              )}
            </div>
            {daysLeft !== null && (
              isClosed ? (
                <div className="badge badge-red" style={{ padding: "10px 20px", fontSize: 14, flexShrink: 0 }}>Applications Closed</div>
              ) : (
                <Link href={`/careers/apply/${posting.id}`} className="apply-bar-btn">
                  Apply Now <ArrowRight size={16} />
                </Link>
              )
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
