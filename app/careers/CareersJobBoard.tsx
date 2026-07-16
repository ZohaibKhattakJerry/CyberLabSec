"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  Shield,
  Search,
  ChevronRight,
  Terminal,
  Users,
  GraduationCap,
  Filter,
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

export default function CareersJobBoard({ postings }: { postings: Posting[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Job" | "Internship">("All");

  const filtered = postings.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const daysUntilDeadline = (deadline: string) => {
    if (now === null) return null;
    const diff = new Date(deadline).getTime() - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysSincePublished = (pubDate: string) => {
    if (now === null) return null;
    const diff = now - new Date(pubDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
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
    } catch (err: unknown) {
      toast.error(err.message || "Network error");
    }
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <PublicNav 
        left={
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <Image src="/logo.png" alt="CyberLabSec Logo" width={180} height={40} style={{ height: 40, width: "auto", objectFit: "contain" }} priority />
          </Link>
        }
        center={<div />}
        right={
          <>
            <Link href="/careers/status" className="hide-mobile" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
              Track Application
            </Link>
            <Link
              href="/employee/login"
              className="btn btn-secondary btn-sm"
            >
              Employee Login
            </Link>
          </>
        }
      />

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
            <span style={{ color: "var(--purple)", display: "block" }}>Join CyberLabSec.</span>
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

      {/* TRACK APPLICATION BANNER */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap",
          background: "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(239,68,68,0.08) 100%)",
          border: "1px solid rgba(168,85,247,0.2)", borderRadius: 16, padding: "20px 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={18} color="var(--purple)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Already Applied?</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Use your Reference ID to track your application status in real-time</div>
            </div>
          </div>
          <Link href="/careers/status" className="btn btn-secondary" style={{ flexShrink: 0, gap: 8 }}>
            <Search size={14} /> Track Application
          </Link>
        </div>
      </div>

      {/* WHY CYBERLABSEC STRIP */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Why CyberLabSec?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8 }}>What sets us apart in offensive security.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            {
              icon: <Terminal size={20} color="var(--purple)" />,
              title: "Real Client Engagements",
              desc: "Live penetration tests from day one—not simulated labs. Your reports drive real client remediation.",
            },
            {
              icon: <Users size={20} color="var(--purple)" />,
              title: "Senior Mentorship",
              desc: "Direct code reviews and guidance from experienced offensive security operators.",
            },
            {
              icon: <Shield size={20} color="var(--purple)" />,
              title: "Results-Driven Culture",
              desc: "Fully remote. We measure technical excellence and impact, not hours online.",
            },
            {
              icon: <GraduationCap size={20} color="var(--purple)" />,
              title: "Verifiable Credentials",
              desc: "Completion certificates and Letters of Recommendation from our founder for top performers.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="card"
              style={{ padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(168,85,247,0.2)", flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FILTERS */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        {postings.length > 3 && (
          <div
            className="flex-mobile-col"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: 1, width: "100%" }}>
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
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {(["All", "Job", "Internship"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={typeFilter === t ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                  style={{ flexShrink: 0 }}
                >
                  {t === "Internship" ? <GraduationCap size={14} /> : <Filter size={14} />}
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Job listings */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "80px 24px",
              color: "var(--text-muted)",
              background: "rgba(168,85,247,0.02)",
              borderRadius: 16,
              border: "1px dashed rgba(168,85,247,0.2)",
            }}
          >
            <Shield size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p style={{ fontSize: 16, marginBottom: 8, color: "var(--text-primary)" }}>No open positions right now.</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Leave your email and we'll notify you when we're hiring.</p>
            
            {talentSubmitted ? (
              <div style={{ display: "inline-block", background: "rgba(34,197,94,0.1)", color: "var(--green)", padding: "10px 20px", borderRadius: 8, fontSize: 14 }}>
                Added to Talent Pool. We'll be in touch!
              </div>
            ) : (
              <form onSubmit={handleTalentSubmit} style={{ display: "flex", gap: 8, maxWidth: 360, margin: "0 auto" }}>
                <input 
                  type="email" 
                  className="input" 
                  placeholder="name@example.com" 
                  required 
                  value={talentEmail}
                  onChange={(e) => setTalentEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">Join</button>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div layout style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence mode="popLayout">
            {filtered.map((posting, i) => {
              const days = daysUntilDeadline(posting.deadline);
              const postedDays = daysSincePublished(posting.publishedDate);
              const isUrgent = days !== null && days <= 7;

              return (
                <motion.div
                  key={posting.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/careers/${posting.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <article
                      className="card card-hover"
                      style={{ cursor: "pointer" }}
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
                        className="flex-mobile-col"
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
                              posting.type === "Job" ? "badge badge-blue" : "badge badge-amber"
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
                               color: days !== null && days <= 3 ? "var(--red)" : isUrgent ? "var(--amber)" : "var(--text-muted)",
                               justifyContent: "flex-end",
                               fontWeight: days !== null && days <= 3 ? 600 : 400,
                               marginBottom: 2,
                             }}
                           >
                             <Clock size={12} />
                             {days !== null ? (
                               days > 0 ? `Closes ${format(new Date(posting.deadline), "MMM d")}` : "Closed"
                             ) : "..."}
                           </div>
                           <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                             {postedDays !== null ? (
                               postedDays === 0 ? "Posted today" : `Posted ${postedDays}d ago`
                             ) : "..."}
                             {posting.showApplicantCount && (
                               <span> · {posting._count.applicants} applicant{posting._count.applicants !== 1 ? "s" : ""}</span>
                             )}
                           </div>
                         </div>
                        <ChevronRight
                          size={18}
                          style={{
                            color: "var(--text-muted)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "40px 24px",
          marginTop: 60,
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
          <a href="/careers/status" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Track Application</a>
          <a href="mailto:careers@cyberlabsec.tech" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>careers@cyberlabsec.tech</a>
          <a href="https://cyberlabsec.tech" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>cyberlabsec.tech</a>
        </div>
        © {new Date().getFullYear()} CyberLabSec. All rights reserved.
      </footer>
    </div>
  );
}
