"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  Shield,
  Search,
  ChevronRight,
  Terminal,
  Users,
  GraduationCap,
  Filter,
} from "lucide-react";

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
  _count: { applicants: number };
}

export default function CareersJobBoard({ postings }: { postings: Posting[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Job" | "Internship">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = postings.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const daysUntilDeadline = (deadline: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="https://cyberlabsec.tech" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 32, objectFit: "contain" }} />
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              href="https://cyberlabsec.tech"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Main Site
            </Link>
            <Link
              href="/portal/login"
              className="btn btn-secondary btn-sm"
            >
              Employee Login
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "80px 24px 60px",
          overflow: "hidden",
        }}
      >
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "800px",
            height: "100%",
            background: "radial-gradient(circle at center, rgba(192,132,252,.55) 0%, rgba(139,92,246,.35) 25%, rgba(109,40,217,.18) 45%, rgba(5,5,5,0) 70%)",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />
        <CareersHeroBackground />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.2)",
              borderRadius: 99,
              padding: "6px 14px",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--purple)",
                boxShadow: "0 0 8px var(--purple)",
                animation: "pulse-glow 2s ease infinite",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>
              {postings.length} OPEN POSITION{postings.length !== 1 ? "S" : ""}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              lineHeight: 1.1,
              margin: "0 0 20px",
            }}
          >
            Hack for a Living.{" "}
            <span style={{ color: "var(--purple)", display: "block" }}>Join CyberLab.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              marginBottom: 40,
              lineHeight: 1.7,
            }}
          >
            We find what others miss — because we think like attackers. 
            If you do too, there&apos;s a place for you here.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: <Shield size={16} />, label: "Offensive Security", value: "Real Work" },
              { icon: <Terminal size={16} />, label: "Tools Used Daily", value: "Industry Standard" },
              { icon: <Users size={16} />, label: "Team Size", value: "Small & Elite" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}
              >
                <span style={{ color: "var(--purple)" }}>{stat.icon}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FILTERS */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search positions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["All", "Job", "Internship"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={typeFilter === t ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
              >
                {t === "Internship" ? <GraduationCap size={14} /> : <Filter size={14} />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Job listings */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "80px 24px",
              color: "var(--text-muted)",
            }}
          >
            <Shield size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p style={{ fontSize: 16, marginBottom: 8 }}>No open positions available right now.</p>
            <p style={{ fontSize: 14 }}>Check back soon — we move fast.</p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((posting, i) => {
              const days = daysUntilDeadline(posting.deadline);
              const isExpanded = expandedId === posting.id;
              const isUrgent = days <= 7;

              return (
                <motion.article
                  key={posting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="card card-hover"
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : posting.id)}
                >
                  <div style={{ padding: "20px 24px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Left: Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <h2
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              margin: 0,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {posting.title}
                          </h2>
                          <span
                            className={
                              posting.type === "Job" ? "badge badge-purple" : "badge badge-purple"
                            }
                          >
                            {posting.type}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 16,
                            flexWrap: "wrap",
                            fontSize: 13,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Briefcase size={13} />
                            {posting.department}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <MapPin size={13} />
                            {posting.location}
                          </span>
                          {posting.universityRequired && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <GraduationCap size={13} />
                              University Required
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Deadline + CTA */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: 13,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: isUrgent ? "var(--purple)" : "var(--text-muted)",
                              justifyContent: "flex-end",
                              marginBottom: 2,
                            }}
                          >
                            <Clock size={12} />
                            {days > 0 ? `${days}d left` : "Closing soon"}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                            {posting._count.applicants} applicant
                            {posting._count.applicants !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          style={{
                            color: "var(--text-muted)",
                            transform: isExpanded ? "rotate(90deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        />
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              borderTop: "1px solid var(--border)",
                              marginTop: 16,
                              paddingTop: 20,
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 24,
                                marginBottom: 24,
                              }}
                            >
                              <div>
                                <h3
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: 8,
                                  }}
                                >
                                  About This Role
                                </h3>
                                <p
                                  style={{
                                    fontSize: 14,
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {posting.description}
                                </p>
                              </div>
                              <div>
                                <h3
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: 8,
                                  }}
                                >
                                  Requirements
                                </h3>
                                <p
                                  style={{
                                    fontSize: 14,
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {posting.requirements}
                                </p>
                              </div>
                            </div>

                            {posting.universityRequired && (
                              <div
                                style={{
                                  background: "rgba(168,85,247,0.06)",
                                  border: "1px solid rgba(168,85,247,0.15)",
                                  borderRadius: 8,
                                  padding: "12px 16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  marginBottom: 20,
                                  fontSize: 13,
                                  color: "#c084fc",
                                }}
                              >
                                <GraduationCap size={16} />
                                This is an internship position. University enrollment may be required.
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <Link
                                href={`/careers/apply/${posting.id}`}
                                className="btn btn-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Apply Now
                                <ChevronRight size={16} />
                              </Link>
                              <div
                                style={{
                                  background: "rgba(168,85,247,0.08)",
                                  border: "1px solid rgba(168,85,247,0.15)",
                                  borderRadius: 8,
                                  padding: "8px 14px",
                                  fontSize: 12,
                                  color: "#c084fc",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <Shield size={13} />
                                AI-powered screening — results in minutes
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "40px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
          marginTop: 60,
        }}
      >
        <p>
          &copy; 2025 CyberLab. All rights reserved.{" "}
          <Link
            href="https://cyberlabsec.tech"
            style={{ color: "var(--purple)", textDecoration: "none" }}
          >
            cyberlabsec.tech
          </Link>
        </p>
      </footer>
    </div>
  );
}
