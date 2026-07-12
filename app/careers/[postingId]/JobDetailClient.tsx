"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, MapPin, Briefcase, Clock, GraduationCap, ChevronRight, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

interface Posting {
  id: string; title: string; type: string; department: string;
  location: string; description: string; requirements: string;
  universityRequired: boolean; deadline: string; showApplicantCount: boolean; publishedDate: string;
  _count: { applicants: number };
}

export default function JobDetailClient({ posting }: { posting: Posting }) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [postedDays, setPostedDays] = useState(0);
  
  useEffect(() => {
    const diff = new Date(posting.deadline).getTime() - Date.now();
    setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    
    const pDiff = Date.now() - new Date(posting.publishedDate).getTime();
    setPostedDays(Math.max(0, Math.floor(pDiff / (1000 * 60 * 60 * 24))));
  }, [posting]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/careers" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text-secondary)", fontSize: 14 }}>
          <ChevronLeft size={16} /> Back to Roles
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 48, objectFit: "contain", margin: "0 auto" }} />
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleShare}>
            <Share2 size={14} /> Share Role
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 100px" }}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <span className="badge badge-purple">{posting.type}</span>
            <span className="badge badge-gray">{posting.department}</span>
            {posting.universityRequired && <span className="badge badge-amber"><GraduationCap size={12} style={{ marginRight: 4 }} /> University Required</span>}
          </div>
          
          <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 16 }}>
            {posting.title}
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={16} /> {posting.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={16} /> {posting.department}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: daysLeft <= 7 ? "var(--purple)" : "inherit" }}>
              <Clock size={16} /> {daysLeft > 0 ? `Closes in ${daysLeft} days` : "Closing soon"}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ height: 1, background: "var(--border)", marginBottom: 40 }} />

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>About This Role</h2>
            <div style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {posting.description}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Requirements</h2>
            <div style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {posting.requirements}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky Bottom Apply Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)", padding: "16px 24px", zIndex: 100 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{posting.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {postedDays === 0 ? "Posted today" : `Posted ${postedDays} days ago`}
              {posting.showApplicantCount && ` • ${posting._count.applicants} applicant${posting._count.applicants !== 1 ? "s" : ""}`}
            </div>
          </div>
          <Link href={`/careers/apply/${posting.id}`} className="btn btn-primary btn-lg">
            Apply Now <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
