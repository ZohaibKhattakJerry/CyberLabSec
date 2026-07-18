"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Users, Bell, User, LogOut,
  Menu, X, ChevronRight, Trophy, FileText, Calendar, CalendarDays, LifeBuoy, Video
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AttendanceTracker from "@/components/AttendanceTracker";

interface Employee {
  id: string; name: string; email: string; designation: string; employeeCode: string;
  employmentType: string; photoUrl: string | null;
  team: { id: string; name: string } | null;
}

const NAV = [
  { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/employee/documents", label: "My Documents", icon: FileText },
  { href: "/employee/team", label: "My Team", icon: Users },
  { href: "/employee/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/employee/attendance", label: "Attendance", icon: Calendar },
  { href: "/employee/leave", label: "Leave", icon: CalendarDays },
  { href: "/employee/support", label: "Support", icon: LifeBuoy },
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
        <Link href="/employee/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none", flex: 1 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 32, objectFit: "contain" }} />
        </Link>
        <button className="show-mobile" onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      {/* Employee info */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", flexShrink: 0, overflow: "hidden", boxShadow: "0 4px 12px rgba(168,85,247,0.25)" }}>
            {employee.photoUrl ? (
              <img src={employee.photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              employee.name.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{employee.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employee.designation}</div>
          </div>
        </div>
        {employee.team && (
          <div style={{ marginTop: 10, padding: "4px 10px", background: "rgba(168,85,247,0.1)", borderRadius: 6, fontSize: 11, color: "var(--purple)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, border: "1px solid rgba(168,85,247,0.2)" }}>
            <Users size={10} /> {employee.team.name}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/employee/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  borderRadius: 8, marginBottom: 2, transition: "all 0.15s",
                  background: active ? "rgba(168,85,247,0.12)" : "transparent",
                  color: active ? "var(--purple)" : "var(--text-secondary)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  borderLeft: active ? "2px solid var(--purple)" : "2px solid transparent",
                }}
              >
                <Icon size={15} />
                {label}
                {active && <ChevronRight size={11} style={{ marginLeft: "auto", opacity: 0.7 }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout + Notifications */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={logout} className="btn btn-ghost" style={{ justifyContent: "flex-start", gap: 8, fontSize: 13, color: "var(--text-muted)", flex: 1 }}>
          <LogOut size={14} /> Sign Out
        </button>
        <NotificationBell />
      </div>
    </aside>
  );

  return (
    <div className="layout-sidebar">
      <AttendanceTracker />
      {sidebarContent}

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
        <div
          className="mobile-topbar"
          style={{
            display: "none", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", height: 56, borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50,
          }}
        >
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 8 }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 24, objectFit: "contain" }} />
          <div style={{ width: 36 }} /> {/* Placeholder to balance the flex space */}
        </div>

        <main style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
