"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Bell, Settings, LogOut,
  Menu, X, ChevronRight, Trophy, ClipboardList, Building2,
  Briefcase, LifeBuoy, Sparkles
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/company/dashboard", label: "Overview", icon: LayoutDashboard, color: "#6366f1" },
  { href: "/company/postings", label: "Job Postings", icon: Briefcase, color: "#8b5cf6" },
  { href: "/company/applications", label: "Applications", icon: ClipboardList, color: "#a855f7" },
  { href: "/company/employees", label: "Employees", icon: Users, color: "#7c3aed" },
  { href: "/company/workspace", label: "Workspace", icon: Building2, color: "#4f46e5" },
  { href: "/company/tickets", label: "Support Tickets", icon: LifeBuoy, color: "#06b6d4" },
  { href: "/company/leaderboard", label: "Leaderboard", icon: Trophy, color: "#f59e0b" },
  { href: "/company/announcements", label: "Announcements", icon: Bell, color: "#ec4899" },
  { href: "/company/settings", label: "Settings", icon: Settings, color: "#64748b" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logout = async () => {
    await fetch("/api/auth/logout?role=admin", { method: "POST" });
    router.push("/company/login");
  };

  const sidebarContent = (
    <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Admin Sidebar Shell ─────────────────────────── */
        .admin-sidebar {
          position: fixed; left: 0; top: 0; bottom: 0;
          width: 252px; z-index: 100; overflow: hidden;
          display: flex; flex-direction: column;
          background: linear-gradient(180deg, #08060f 0%, #0a0812 60%, #06050c 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* Animated background blobs */
        .admin-sidebar::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 140px 200px at 10% 20%, rgba(99,102,241,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 100px 180px at 80% 70%, rgba(168,85,247,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 80px 120px at 50% 50%, rgba(79,70,229,0.05) 0%, transparent 70%);
          animation: blobPulse 8s ease-in-out infinite;
        }
        @keyframes blobPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        /* Shimmering top edge */
        .admin-sidebar::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(99,102,241,0.5), transparent);
          animation: shimmer 4s linear infinite;
          background-size: 200% 100%;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Sidebar content layers above the blobs */
        .admin-sidebar > * { position: relative; z-index: 1; }

        /* Brand */
        .admin-brand {
          padding: 20px 18px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: flex-start; justify-content: space-between;
          background: linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%);
        }
        .admin-brand-badge {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 6px; padding: 3px 10px; border-radius: 20px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
          color: #818cf8; font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Nav */
        .admin-nav {
          flex: 1; padding: 10px 10px; overflow-y: auto;
          scrollbar-width: none;
        }
        .admin-nav::-webkit-scrollbar { display: none; }

        /* Nav items */
        .admin-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px; margin-bottom: 3px;
          font-size: 13.5px; font-weight: 500; text-decoration: none;
          position: relative; overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255,255,255,0.5);
          border: 1px solid transparent;
          cursor: pointer;
        }
        .admin-nav-item::before {
          content: '';
          position: absolute; inset: 0; opacity: 0;
          transition: opacity 0.25s;
          border-radius: 12px;
        }
        .admin-nav-item:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
          transform: translateX(3px);
        }
        .admin-nav-item.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.15) 100%);
          border-color: rgba(99,102,241,0.3);
          font-weight: 700;
          box-shadow: 0 4px 20px rgba(99,102,241,0.15), inset 0 1px 1px rgba(255,255,255,0.06);
        }
        .admin-nav-item.active::before {
          opacity: 1;
          background: linear-gradient(90deg, rgba(99,102,241,0.08) 0%, transparent 100%);
        }

        /* Icon wrapper */
        .admin-nav-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s;
          background: rgba(255,255,255,0.04);
        }
        .admin-nav-item.active .admin-nav-icon {
          background: rgba(99,102,241,0.2);
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
        }
        .admin-nav-item:hover .admin-nav-icon {
          background: rgba(255,255,255,0.07);
          transform: scale(1.08);
        }

        /* Active left bar indicator */
        .admin-nav-item.active::after {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #818cf8, #a855f7);
          box-shadow: 0 0 8px rgba(129,140,248,0.6);
        }

        /* Section dividers */
        .admin-nav-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin: 8px 4px;
        }

        /* Footer */
        .admin-sidebar-footer {
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(0,0,0,0.2);
        }
        .admin-logout-btn {
          display: flex; align-items: center; gap: 8px;
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 500;
          padding: 8px 12px; border-radius: 10px;
          transition: all 0.2s; flex: 1;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .admin-logout-btn:hover {
          background: rgba(239,68,68,0.1); color: #f87171;
          border: 1px solid rgba(239,68,68,0.2);
        }

        /* Tooltip that appears on hover */
        .admin-nav-tooltip {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          opacity: 0; transition: all 0.2s;
          pointer-events: none;
        }
        .admin-nav-item.active .admin-nav-tooltip { opacity: 0.7; }

        /* Mobile sidebar */
        @media (max-width: 1024px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 40px rgba(0,0,0,0.6);
          }
          .show-mobile { display: flex !important; }
          .hide-mobile { display: none; }
        }
        @media (min-width: 1025px) {
          .show-mobile { display: none !important; }
        }

        /* Particle dots decoration */
        .admin-particles {
          position: absolute; top: 0; right: 0; left: 0; bottom: 0;
          pointer-events: none; z-index: 0; overflow: hidden;
        }
        .admin-particle {
          position: absolute; border-radius: 50%;
          background: rgba(168,85,247,0.3);
          animation: floatParticle linear infinite;
        }
        @keyframes floatParticle {
          0% { transform: translateY(100%) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Decorative particles */}
      <div className="admin-particles">
        {mounted && [
          { size: 3, left: "20%", delay: "0s", dur: "12s" },
          { size: 2, left: "60%", delay: "3s", dur: "9s" },
          { size: 4, left: "80%", delay: "6s", dur: "15s" },
          { size: 2, left: "40%", delay: "9s", dur: "11s" },
        ].map((p, i) => (
          <div
            key={i}
            className="admin-particle"
            style={{ width: p.size, height: p.size, left: p.left, bottom: 0, animationDelay: p.delay, animationDuration: p.dur }}
          />
        ))}
      </div>

      {/* Brand */}
      <div className="admin-brand">
        <div>
          <Link href="/company/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 10 }}>
            <img src="/logo.png" alt="CyberLabSec" style={{ height: 30, objectFit: "contain" }} />
          </Link>
          <div className="admin-brand-badge">
            <Sparkles size={8} />
            Company Console
          </div>
        </div>
        <button
          className="show-mobile"
          onClick={() => setMobileOpen(false)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "none" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="admin-nav">
        {NAV.map(({ href, label, icon: Icon, color }, idx) => {
          const active = href === "/company/dashboard" ? pathname === href : pathname.startsWith(href);
          // Dividers before specific sections
          const showDivider = idx === 4 || idx === 6 || idx === 8;
          return (
            <div key={href}>
              {showDivider && <div className="admin-nav-divider" />}
              <Link
                href={href}
                style={{ textDecoration: "none" }}
                onClick={() => setMobileOpen(false)}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
              >
                <div className={`admin-nav-item ${active ? "active" : ""}`}>
                  <div
                    className="admin-nav-icon"
                    style={active ? { backgroundColor: `${color}22`, boxShadow: `0 0 14px ${color}44` } : {}}
                  >
                    <Icon
                      size={15}
                      style={{ color: active ? color : hoveredHref === href ? "#fff" : "rgba(255,255,255,0.45)" }}
                    />
                  </div>
                  <span style={{ flex: 1, letterSpacing: active ? "-0.01em" : "normal" }}>{label}</span>
                  <div className="admin-nav-tooltip">
                    <ChevronRight size={12} style={{ color: active ? color : "rgba(255,255,255,0.4)" }} />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <button onClick={logout} className="admin-logout-btn">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="layout-sidebar">
      {sidebarContent}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99, backdropFilter: "blur(8px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Desktop topbar */}
        <div
          className="desktop-topbar"
          style={{
            alignItems: "center", justifyContent: "flex-end",
            padding: "0 24px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(8,6,15,0.9)", backdropFilter: "blur(20px)",
            position: "sticky", top: 0, zIndex: 50, gap: 12,
          }}
        >
          <NotificationBell isAdmin={true} placement="bottom-left" />
        </div>

        {/* Mobile topbar */}
        <div
          className="mobile-topbar"
          style={{
            display: "none", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(8,6,15,0.95)", backdropFilter: "blur(20px)",
            position: "sticky", top: 0, zIndex: 50,
          }}
        >
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", padding: 8 }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <img src="/logo.png" alt="CyberLabSec" style={{ height: 24, objectFit: "contain" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell isAdmin={true} placement="top-right" />
          </div>
        </div>

        <main style={{ padding: "24px 20px", maxWidth: 1280, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
