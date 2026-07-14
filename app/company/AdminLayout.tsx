"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield, LayoutDashboard, Users, Bell, Settings, LogOut,
  Menu, X, ChevronRight, Trophy, ClipboardList, Building2,
  Briefcase, UserCheck
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/company/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/company/postings", label: "Job Postings", icon: Briefcase },
  { href: "/company/applications", label: "Applications", icon: ClipboardList },
  { href: "/company/final-approval", label: "Final Approval", icon: UserCheck },
  { href: "/company/employees", label: "Employees", icon: Users },
  { href: "/company/teams", label: "Teams", icon: Building2 },
  { href: "/company/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/company/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/company/announcements", label: "Announcements", icon: Bell },
  { href: "/company/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/company/login");
  };

  return (
    <div className="layout-sidebar">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/company/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 10 }}>
            <img src="/logo.png" alt="CyberLabSec" style={{ height: 32, objectFit: "contain" }} />
          </Link>
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Company Console</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px" }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                    borderRadius: 8, marginBottom: 2, transition: "all 0.15s",
                    background: active ? "rgba(168,85,247,0.1)" : "transparent",
                    color: active ? "var(--purple)" : "var(--text-secondary)",
                    fontSize: 14, fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={16} />
                  {label}
                  {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={logout} className="btn btn-ghost" style={{ justifyContent: "flex-start", gap: 10, fontSize: 14, color: "var(--text-muted)", flex: 1 }}>
            <LogOut size={16} /> Sign Out
          </button>
          <NotificationBell role="admin" />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Mobile topbar */}
        <div style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 56,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }} className="mobile-topbar">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src="/logo.png" alt="CyberLabSec" style={{ height: 24, objectFit: "contain" }} />
          <NotificationBell role="admin" />
        </div>

        <main style={{ padding: "32px 24px", maxWidth: 1280, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
