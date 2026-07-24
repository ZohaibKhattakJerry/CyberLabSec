"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, ChevronRight, Trophy, FileText, LifeBuoy,
  LayoutDashboard, User, Briefcase, Users, LogOut,
  Calendar, CalendarDays, Sparkles
} from "lucide-react";
import AttendanceTracker from "@/components/AttendanceTracker";
import EmployeeTour from "@/components/EmployeeTour";
import NotificationBell from "@/components/NotificationBell";

interface Employee {
  id: string; name: string; email: string; designation: string; employeeCode: string;
  employmentType: string; photoUrl: string | null;
  team: { id: string; name: string } | null;
}

const NAV = [
  { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#6366f1" },
  { href: "/employee/tasks", label: "Tasks", icon: FileText, color: "#8b5cf6" },
  { href: "/employee/team", label: "My Team", icon: Users, color: "#a855f7" },
  { href: "/employee/attendance", label: "Attendance", icon: Calendar, color: "#06b6d4" },
  { href: "/employee/leave", label: "Leave Requests", icon: CalendarDays, color: "#10b981" },
  { href: "/employee/documents", label: "My Documents", icon: Briefcase, color: "#f59e0b" },
  { href: "/employee/leaderboard", label: "Leaderboard", icon: Trophy, color: "#eab308" },
  { href: "/employee/support", label: "Support", icon: LifeBuoy, color: "#ec4899" },
  { href: "/employee/profile", label: "Profile", icon: User, color: "#64748b" },
];

export default function PortalLayout({ children, employee }: { children: React.ReactNode; employee: Employee }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logout = async () => {
    await fetch("/api/auth/logout?role=employee", { method: "POST" });
    router.push("/employee/login");
  };

  const initials = employee.name.substring(0, 2).toUpperCase();

  const sidebarContent = (
    <aside className={`emp-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Employee Sidebar Shell ─────────────────────── */
        .emp-sidebar {
          position: fixed; left: 0; top: 0; bottom: 0;
          width: 252px; z-index: 100; overflow: hidden;
          display: flex; flex-direction: column;
          background: linear-gradient(180deg, #07050f 0%, #09070e 60%, #050408 100%);
          border-right: 1px solid rgba(255,255,255,0.055);
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* Animated background blobs */
        .emp-sidebar::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 160px 220px at 0% 15%, rgba(168,85,247,0.1) 0%, transparent 70%),
            radial-gradient(ellipse 120px 160px at 90% 60%, rgba(99,102,241,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 100px 140px at 40% 85%, rgba(139,92,246,0.06) 0%, transparent 70%);
          animation: empBlobPulse 10s ease-in-out infinite alternate;
        }
        @keyframes empBlobPulse {
          0% { opacity: 0.8; transform: scale(1) translateY(0); }
          100% { opacity: 1; transform: scale(1.04) translateY(-8px); }
        }

        /* Top shimmer */
        .emp-sidebar::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(99,102,241,0.4), transparent);
          background-size: 300% 100%;
          animation: empShimmer 5s linear infinite;
        }
        @keyframes empShimmer {
          0% { background-position: -300% 0; }
          100% { background-position: 300% 0; }
        }

        .emp-sidebar > * { position: relative; z-index: 1; }

        /* Brand */
        .emp-brand {
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(180deg, rgba(168,85,247,0.06) 0%, transparent 100%);
        }

        /* Profile card */
        .emp-profile {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%);
        }
        .emp-avatar {
          width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; color: #fff; overflow: hidden;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          box-shadow: 0 4px 14px rgba(168,85,247,0.35);
          position: relative;
        }
        .emp-avatar::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          border-radius: inherit;
        }
        .emp-team-badge {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 8px; padding: 3px 9px; border-radius: 20px;
          background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2);
          color: #c084fc; font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
          max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Nav */
        .emp-nav {
          flex: 1; padding: 10px; overflow-y: auto;
          scrollbar-width: none;
        }
        .emp-nav::-webkit-scrollbar { display: none; }

        /* Nav items */
        .emp-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 11px; border-radius: 11px; margin-bottom: 2px;
          font-size: 13px; font-weight: 500; text-decoration: none;
          position: relative; overflow: hidden;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255,255,255,0.45);
          border: 1px solid transparent;
          cursor: pointer;
        }
        .emp-nav-item:hover {
          color: rgba(255,255,255,0.88);
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
          transform: translateX(4px);
        }
        .emp-nav-item.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.12) 100%);
          border-color: rgba(168,85,247,0.28);
          font-weight: 700;
          box-shadow: 0 4px 18px rgba(168,85,247,0.12), inset 0 1px 1px rgba(255,255,255,0.05);
        }
        .emp-nav-item.active::after {
          content: '';
          position: absolute; left: 0; top: 22%; bottom: 22%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #a855f7, #6366f1);
          box-shadow: 0 0 10px rgba(168,85,247,0.7);
        }

        /* Icon */
        .emp-nav-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.22s;
          background: rgba(255,255,255,0.03);
        }
        .emp-nav-item.active .emp-nav-icon {
          background: rgba(168,85,247,0.15);
          box-shadow: 0 0 12px rgba(168,85,247,0.25);
        }
        .emp-nav-item:hover .emp-nav-icon {
          background: rgba(255,255,255,0.07);
          transform: scale(1.1) rotate(-2deg);
        }

        /* Dividers */
        .emp-nav-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent);
          margin: 7px 2px;
        }

        /* Footer */
        .emp-sidebar-footer {
          padding: 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.15);
        }
        .emp-logout-btn {
          display: flex; align-items: center; gap: 8px;
          background: transparent; border: 1px solid transparent; cursor: pointer;
          color: rgba(255,255,255,0.3); font-size: 13px; font-weight: 500;
          padding: 8px 12px; border-radius: 10px;
          transition: all 0.2s; width: 100%;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .emp-logout-btn:hover {
          background: rgba(239,68,68,0.08); color: #f87171;
          border-color: rgba(239,68,68,0.18);
        }

        /* Floating particles */
        .emp-particles {
          position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        }
        .emp-particle {
          position: absolute; border-radius: 50%;
          background: rgba(168,85,247,0.25);
          animation: empFloat linear infinite;
        }
        @keyframes empFloat {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 0.3; }
          100% { transform: translateY(-280px) scale(1.2); opacity: 0; }
        }

        /* Mobile */
        @media (max-width: 1024px) {
          .emp-sidebar {
            transform: translateX(-100%);
            transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .emp-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 6px 0 40px rgba(0,0,0,0.7);
          }
        }
      `}</style>

      {/* Particles */}
      <div className="emp-particles">
        {mounted && [
          { size: 3, left: "15%", delay: "0s", dur: "14s" },
          { size: 2, left: "55%", delay: "4s", dur: "10s" },
          { size: 4, left: "75%", delay: "7s", dur: "16s" },
          { size: 2, left: "35%", delay: "11s", dur: "12s" },
        ].map((p, i) => (
          <div
            key={i}
            className="emp-particle"
            style={{ width: p.size, height: p.size, left: p.left, bottom: "10%", animationDelay: p.delay, animationDuration: p.dur }}
          />
        ))}
      </div>

      {/* Brand */}
      <div className="emp-brand">
        <Link href="/employee/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 28, objectFit: "contain" }} />
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            display: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer",
          }}
          className="show-mobile"
        >
          <X size={16} />
        </button>
      </div>

      {/* Profile */}
      <div className="emp-profile">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="emp-avatar" id="tour-notification-bell-sidebar">
            {employee.photoUrl
              ? <img src={employee.photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              {employee.name}
            </div>
            <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {employee.designation}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
              {employee.employeeCode}
            </div>
          </div>
          
          <div style={{ marginLeft: "auto" }}>
            <NotificationBell isAdmin={false} placement="right-start" />
          </div>
        </div>
        {employee.team && (
          <div className="emp-team-badge">
            <Users size={9} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{employee.team.name}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="emp-nav" id="tour-sidebar-nav">
        {NAV.map(({ href, label, icon: Icon, color }, idx) => {
          const active = pathname === href || (href !== "/employee/dashboard" && pathname.startsWith(href));
          const showDivider = idx === 5 || idx === 7;
          return (
            <div key={href}>
              {showDivider && <div className="emp-nav-divider" />}
              <Link
                href={href}
                style={{ textDecoration: "none" }}
                onClick={() => setMobileOpen(false)}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
              >
                <div
                  id={`tour-nav-${href.split("/").pop()}`}
                  className={`emp-nav-item ${active ? "active" : ""}`}
                >
                  <div
                    className="emp-nav-icon"
                    style={active ? { backgroundColor: `${color}20`, boxShadow: `0 0 12px ${color}35` } : {}}
                  >
                    <Icon
                      size={14}
                      style={{ color: active ? color : hoveredHref === href ? "#fff" : "rgba(255,255,255,0.4)" }}
                    />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && (
                    <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="emp-sidebar-footer">
        <button onClick={logout} className="emp-logout-btn">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="layout-sidebar">
      <EmployeeTour />
      <AttendanceTracker />
      {sidebarContent}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99, backdropFilter: "blur(8px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="main-content" style={{ position: "relative" }}>
        
        {/* Mobile topbar */}
        <div
          className="mobile-topbar"
          style={{
            display: "none", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(7,5,15,0.95)", backdropFilter: "blur(20px)",
            position: "sticky", top: 0, zIndex: 50,
          }}
        >
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex", padding: 8 }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 24, objectFit: "contain" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell isAdmin={false} placement="top-right" />
          </div>
        </div>

        <main style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
