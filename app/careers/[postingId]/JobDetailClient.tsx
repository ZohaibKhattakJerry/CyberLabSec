"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft, MapPin, Briefcase, Clock, GraduationCap, ChevronRight,
  Share2, MessageCircle, Copy, CheckCircle, DollarSign,
  Calendar, Users, Zap, BookOpen, Gift,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
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
  const [daysLeft, setDaysLeft] = useState(0);
  const [postedDays, setPostedDays] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const diff = new Date(posting.deadline).getTime() - Date.now();
    setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const pDiff = Date.now() - new Date(posting.publishedDate).getTime();
    setPostedDays(Math.max(0, Math.floor(pDiff / (1000 * 60 * 60 * 24))));
  }, [posting]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(posting.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, "_blank");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`🔐 ${posting.title} — CyberLabSec\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const isUrgent = daysLeft <= 3 && daysLeft > 0;
  const isClosed = daysLeft <= 0;

  const parseLines = (text: string) =>
    text.split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[-•]\s*/, "").trim());

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Sticky Nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10,10,15,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          gap: 16,
        }}
      >
        <Link
          href="/careers"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "var(--text-secondary)",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          <ChevronLeft size={16} /> Careers
        </Link>
        <img src="/logo.png" alt="CyberLabSec" style={{ height: 44, objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleCopy} title="Copy link">
            {copied ? <CheckCircle size={15} color="var(--green)" /> : <Copy size={15} />}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLinkedIn} title="Share on LinkedIn">
            <Share2 size={15} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleWhatsApp} title="Share on WhatsApp">
            <MessageCircle size={15} />
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "48px 24px 120px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <span className={`badge ${posting.type === "Job" ? "badge-blue" : "badge-amber"}`}>
              {posting.type}
            </span>
            <span className="badge badge-gray">{posting.department}</span>
            {posting.universityRequired && (
              <span className="badge badge-purple">
                <GraduationCap size={11} /> University Required
              </span>
            )}
            {isUrgent && <span className="badge badge-red">⚠ Closes in {daysLeft} days</span>}
            {isClosed && <span className="badge badge-red">Closed</span>}
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
              marginBottom: 20,
              lineHeight: 1.15,
            }}
          >
            {posting.title}
          </h1>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 24px",
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 36,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={15} /> {posting.location}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Briefcase size={15} /> {posting.experienceLevel !== "Any" ? `${posting.experienceLevel} Level` : "Any Experience"}
            </span>
            {posting.duration && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={15} /> {posting.duration}
              </span>
            )}
            {posting.weeklyHours && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={15} /> {posting.weeklyHours}h/week
              </span>
            )}
            {posting.openings > 1 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={15} /> {posting.openings} openings
              </span>
            )}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: isUrgent ? "var(--red)" : "inherit",
                fontWeight: isUrgent ? 600 : 400,
              }}
            >
              <Clock size={15} />
              {isClosed
                ? "Closed"
                : `Closes ${format(new Date(posting.deadline), "MMMM d, yyyy")}`}
            </span>
          </div>

          {/* Stipend/salary pill */}
          {posting.stipend && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 10,
                marginBottom: 36,
              }}
            >
              <DollarSign size={16} color="var(--green)" />
              <span style={{ fontWeight: 700, color: "var(--green)" }}>{posting.stipend}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                / month{posting.type === "Internship" ? " stipend" : " salary"}
              </span>
            </div>
          )}
        </motion.div>

        <div style={{ height: 1, background: "var(--border)", marginBottom: 48 }} />

        {/* Main content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {/* About This Role */}
          <Section title="About This Role" icon={<BookOpen size={18} />}>
            <div style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {posting.description}
            </div>
          </Section>

          {/* Requirements */}
          <Section title="Requirements" icon={<Zap size={18} color="var(--purple)" />}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {parseLines(posting.requirements).map((req, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "var(--text-secondary)" }}>
                  <CheckCircle size={16} color="var(--purple)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {req}
                </li>
              ))}
            </ul>
          </Section>

          {/* Nice to Have */}
          {posting.niceToHave && (
            <Section title="Nice to Have" icon={<CheckCircle size={18} color="var(--blue)" />}>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
                {parseLines(posting.niceToHave).map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "var(--text-secondary)" }}>
                    <CheckCircle size={16} color="var(--blue)" style={{ marginTop: 2, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* What You'll Gain */}
          {posting.whatYouGain && (
            <Section title="What You'll Gain" icon={<Gift size={18} color="var(--amber)" />}>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
                {parseLines(posting.whatYouGain).map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "var(--text-secondary)" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🎁</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Share section */}
          <div
            className="card"
            style={{ padding: 24, textAlign: "center", marginTop: 48, border: "1px solid var(--border-accent)" }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
              Know someone who'd be a great fit?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-secondary" onClick={handleCopy}>
                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button className="btn btn-secondary" onClick={handleLinkedIn}>
                <Share2 size={15} /> LinkedIn
              </button>
              <button className="btn btn-secondary" onClick={handleWhatsApp}>
                <MessageCircle size={15} /> WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky Apply Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(10,10,15,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
          padding: "14px 24px",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 840,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, marginBottom: 2 }}>
              {posting.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {postedDays === 0 ? "Posted today" : `Posted ${postedDays}d ago`}
              {posting.showApplicantCount &&
                ` · ${posting._count.applicants} applicant${posting._count.applicants !== 1 ? "s" : ""}`}
              {posting.stipend && ` · ${posting.stipend}/mo`}
            </div>
          </div>
          {isClosed ? (
            <div className="badge badge-red" style={{ padding: "10px 20px", fontSize: 14 }}>
              Applications Closed
            </div>
          ) : (
            <Link href={`/careers/apply/${posting.id}`} className="btn btn-primary">
              Apply Now <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 44 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}
