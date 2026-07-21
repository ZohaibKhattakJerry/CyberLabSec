"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Bell, Settings, LogOut,
  Menu, X, ChevronRight, Trophy, ClipboardList, Building2,
  Briefcase, LifeBuoy
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/company/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/company/postings", label: "Job Postings", icon: Briefcase },
  { href: "/company/applications", label: "Applications", icon: ClipboardList },
  { href: "/company/employees", label: "Employees", icon: Users },
  { href: "/company/workspace", label: "Workspace", icon: Building2 },
  { href: "/company/tickets", label: "Support Tickets", icon: LifeBuoy },
  { href: "/company/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/company/announcements", label: "Announcements", icon: Bell },
  { href: "/company/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const logout = async () => {
    await fetch("/api/auth/logout?role=admin", { method: "POST" });
    router.push("/company/login");
  };

  return (
    <div className="layout-sidebar">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <Link href="/company/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 10 }}>
              <img src="/logo.png" alt="CyberLabSec" style={{ height: 32, objectFit: "contain" }} />
            </Link>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Company Console</div>
          </div>
          <button className="show-mobile" onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
          {NAV.map(({ href, label, icon: Icon, sub }) => {
            const active = href === "/company/dashboard" ? pathname === href : pathname.startsWith(href);
            
            if (sub) {
              return (
                <div key={href}>
                  <div
                    onClick={() => { setWorkspaceOpen(!workspaceOpen); if(pathname !== href) router.push(href); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                      borderRadius: 8, marginBottom: 2, transition: "all 0.15s", cursor: "pointer",
                      background: active ? "rgba(168,85,247,0.1)" : "transparent",
                      color: active ? "var(--purple)" : "var(--text-secondary)",
                      fontSize: 14, fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Icon size={16} />
                    {label}
                    <ChevronRight size={14} style={{ marginLeft: "auto", transform: workspaceOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </div>
                  {workspaceOpen && (
                    <div style={{ marginLeft: 24, marginTop: 4, marginBottom: 4 }}>
                      {sub.map(s => {
                        const sActive = pathname.startsWith(s.href);
                        return (
                          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
                            <div style={{
                              display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
                              borderRadius: 8, marginBottom: 2,
                              background: sActive ? "rgba(168,85,247,0.1)" : "transparent",
                              color: sActive ? "var(--purple)" : "var(--text-secondary)",
                              fontSize: 13, fontWeight: sActive ? 500 : 400,
                            }}>
                              <s.icon size={14} />
                              {s.label}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
          <NotificationBell isAdmin={true} placement="bottom-left" />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99, backdropFilter: "blur(8px)" }}
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
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 8 }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src="/logo.png" alt="CyberLabSec" style={{ height: 24, objectFit: "contain", marginLeft: "12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
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
