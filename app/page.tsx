"use client";

import Link from "next/link";
import { ChevronRight, Shield, ArrowRight, Lock, Users, Terminal } from "lucide-react";
import dynamic from "next/dynamic";

const CareersHeroBackground = dynamic(() => import("@/components/CareersHeroBackground"), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background Effect */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "1000px",
          height: "100%",
          background: "radial-gradient(circle at top, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.05) 35%, rgba(5,5,5,0) 70%)",
          zIndex: 0,
          pointerEvents: "none"
        }}
      />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.5 }}>
        <CareersHeroBackground />
      </div>

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 50, borderBottom: "1px solid var(--border)", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,15,0.7)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, width: "auto", objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/company/login" className="btn btn-secondary btn-sm">Company Portal</Link>
          <Link href="/employee/login" className="btn btn-secondary btn-sm hide-mobile">Employee Portal</Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 99, padding: "6px 16px", marginBottom: 32 }}>
            <Shield size={16} color="var(--purple)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--purple-light)" }}>Next-Generation Offensive Security</span>
          </div>
          
          <h1 style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 24 }}>
            We Secure By <span className="text-glow-purple">Breaking In</span>.
          </h1>
          
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 48, maxWidth: 600, margin: "0 auto 48px" }}>
            CyberLabSec is an elite offensive security firm. We provide continuous penetration testing, red teaming, and vulnerability research for forward-thinking companies.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link href="/company/login" className="btn btn-primary btn-lg" style={{ minWidth: 200 }}>
              Partner With Us <ArrowRight size={20} />
            </Link>
            <Link href="/careers" className="btn btn-secondary btn-lg" style={{ minWidth: 200 }}>
              Join The Team <Terminal size={20} />
            </Link>
          </div>
        </div>

        {/* Features / Portals */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 100 }}>
          <Link href="/careers" style={{ textDecoration: "none" }}>
            <div className="card card-hover" style={{ padding: 32, height: "100%" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Terminal size={24} color="var(--purple)" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Careers & Candidate Portal</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>View open roles, apply for positions, and track your application status in real-time.</p>
              <span style={{ color: "var(--purple)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>Explore Careers <ChevronRight size={16} /></span>
            </div>
          </Link>

          <Link href="/company/login" style={{ textDecoration: "none" }}>
            <div className="card card-hover" style={{ padding: 32, height: "100%" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Lock size={24} color="var(--green)" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Company Portal</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>Secure login for our corporate partners and HR teams to manage hiring pipelines and pentest reports.</p>
              <span style={{ color: "var(--green)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>Partner Login <ChevronRight size={16} /></span>
            </div>
          </Link>

          <Link href="/employee/login" style={{ textDecoration: "none" }}>
            <div className="card card-hover" style={{ padding: 32, height: "100%" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Users size={24} color="var(--blue)" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Employee Portal</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>Internal workspace for CyberLabSec operators to access dashboards, tools, and communications.</p>
              <span style={{ color: "var(--blue)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>Staff Login <ChevronRight size={16} /></span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
