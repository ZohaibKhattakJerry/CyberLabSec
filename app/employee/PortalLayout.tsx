"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, ClipboardList, Users, Bell, User, LogOut,
  Menu, X, ChevronRight, Trophy
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

interface Employee {
  id: string; name: string; email: string; designation: string; employeeCode: string;
  employmentType: string; photoUrl: string | null;
  team: { id: string; name: string } | null;
}

const NAV = [
  { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/employee/team", label: "My Team", icon: Users },
  { href: "/employee/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/employee/announcements", label: "Announcements", icon: Bell },
  { href: "/employee/profile", label: "Profile", icon: User },
];

export default function PortalLayout({ children, employee }: { children: React.ReactNode; employee: Employee }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/employee/login");
  };

  const sidebarContent = (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Brand */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/employee/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 32, objectFit: "contain" }} />
        </Link>
      </div>

      {/* Employee info */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "var(--purple)", flexShrink: 0 }}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employee.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{employee.employeeCode}</div>
          </div>
        </div>
        {employee.team && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={11} /> {employee.team.name}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
              <div 
                className="nav-link-hover"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, marginBottom: 2, transition: "all 0.15s",
                  background: active ? "rgba(168,85,247,0.1)" : "transparent",
                  color: active ? "var(--purple)" : "var(--text-secondary)",
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  transform: "scale(1)",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Notifications & Logout */}
      <div style={{ padding: "12px 12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={logout} className="btn btn-ghost" style={{ justifyContent: "flex-start", gap: 10, fontSize: 14, color: "var(--text-muted)", flex: 1 }}>
          <LogOut size={16} /> Sign Out
        </button>
        <NotificationBell role="employee" />
      </div>
    </aside>
  );

  return (
    <div className="layout-sidebar">
      {/* Desktop sidebar */}
      <div style={{ display: "none" }} className="md:block">
        {sidebarContent}
      </div>
      {sidebarContent}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99, display: "block" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="main-content">
        {/* Mobile topbar */}
        <div className="md:hidden" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 56, borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 24, objectFit: "contain" }} />
          </div>
          <div style={{ width: 32, display: "flex", justifyContent: "flex-end" }}>
            <NotificationBell role="employee" />
          </div>
        </div>

        <main style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
