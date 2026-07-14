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

  const daysUntilDeadline = (deadline: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysSincePublished = (pubDate: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(pubDate).getTime();
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="https://cyberlabsec.tech" style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, objectFit: "contain" }} />
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/careers/status" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
            Track Application
          </Link>
          <Link
            href="/employee/login"
            className="btn btn-secondary btn-sm"
          >
            Employee Login
          </Link>
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
      {/* WHY WORK HERE */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Why Work Here?</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            {
              title: "Tackle the Hardest Problems",
              desc: "From zero-day research to full-scope red teaming, you'll be challenged daily to outsmart the best defenses in the world.",
              icon: <Terminal size={24} color="var(--purple)" />
            },
            {
              title: "Learn from the Elite",
              desc: "Work alongside some of the brightest minds in offensive security. We prioritize knowledge sharing and continuous learning.",
              icon: <Users size={24} color="var(--purple)" />
            },
            {
              title: "Meritocracy Above All",
              desc: "We don't care about your pedigree. We care about what you can do. Our AI screening ensures everyone gets a fair shot based on skill alone.",
              icon: <Briefcase size={24} color="var(--purple)" />
            }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
              className="card"
              style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: 14 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FILTERS */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        {postings.length > 3 && (
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((posting, i) => {
              const days = daysUntilDeadline(posting.deadline);
              const postedDays = daysSincePublished(posting.publishedDate);
              const isUrgent = days <= 7;

              return (
                <Link key={posting.id} href={`/careers/${posting.id}`} style={{ textDecoration: 'none' }}>
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
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
                               color: days <= 3 ? "var(--red)" : isUrgent ? "var(--amber)" : "var(--text-muted)",
                               justifyContent: "flex-end",
                               fontWeight: days <= 3 ? 600 : 400,
                               marginBottom: 2,
                             }}
                           >
                             <Clock size={12} />
                             {days > 0
                               ? `Closes ${format(new Date(posting.deadline), "MMM d")}`
                               : "Closed"}
                           </div>
                           <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                             {postedDays === 0 ? "Posted today" : `Posted ${postedDays}d ago`}
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
                </motion.article>
              </Link>
              );
            })}
          </div>
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
