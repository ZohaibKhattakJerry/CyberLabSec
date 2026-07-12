"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LayoutDashboard, Briefcase, Users, ClipboardList, Bell, Settings, LogOut, Menu, X, ChevronRight, FileText } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/company/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/company/postings", label: "Recruiting", icon: Briefcase },
  { href: "/company/applications", label: "Applications", icon: FileText },
  { href: "/company/ceo-review", label: "CEO Review", icon: Shield },
  { href: "/company/employees", label: "Employees", icon: Users },
  { href: "/company/teams", label: "Teams", icon: Users },
  { href: "/company/tasks", label: "Tasks", icon: ClipboardList },
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

  const sidebarContent = (
    <aside className="sidebar" style={{ background: "#0a0a0f" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/company/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 32, objectFit: "contain" }} />
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div 
                className="nav-link-hover"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderRadius: 8, marginBottom: 4, transition: "all 0.15s",
                  background: active ? "var(--purple)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  transform: "scale(1)",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={logout} className="btn btn-ghost" style={{ justifyContent: "flex-start", gap: 10, fontSize: 14, color: "var(--text-muted)", padding: "10px 14px", flex: 1 }}>
          <LogOut size={18} /> Exit Console
        </button>
        <NotificationBell role="admin" />
      </div>
    </aside>
  );

  return (
    <div className="layout-sidebar">
      <div style={{ display: "none" }} className="md:block">
        {sidebarContent}
      </div>
      {sidebarContent}

      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99, display: "block" }} onClick={() => setMobileOpen(false)} />
      )}

      <div className="main-content">
        <div className="md:hidden" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60, borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 24, objectFit: "contain" }} />
          </div>
          <div style={{ width: 24, display: "flex", justifyContent: "flex-end" }}>
            <NotificationBell role="admin" />
          </div>
        </div>

        <main style={{ padding: "40px", maxWidth: 1400, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
