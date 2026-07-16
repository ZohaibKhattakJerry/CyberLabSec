"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Circle, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read: boolean;
  createdAt: string;
  isAnnouncement?: boolean;
  content?: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAsRead = async (id: string, isAnnouncement?: boolean) => {
    try {
      if (isAnnouncement) {
        await fetch(`/api/employee/announcements/${id}/acknowledge`, { method: "POST" });
      } else {
        await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/read-all`, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref} style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ background: "transparent", border: "none", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%" }}
        className="hover:bg-[rgba(168,85,247,0.1)]"
      >
        <Bell size={20} color="var(--text-secondary)" />
        {unreadCount > 0 && (
          <div style={{ position: "absolute", top: 4, right: 6, width: 8, height: 8, background: "var(--purple)", borderRadius: "50%", boxShadow: "0 0 10px var(--purple)" }} />
        )}
      </button>

      {open && (
        <div className="card animate-fade-up notification-dropdown" style={{ maxHeight: 400, display: "flex", flexDirection: "column", zIndex: 100, overflow: "hidden", marginTop: 8, boxShadow: "var(--shadow-lg)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-elevated)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: "var(--purple)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", display: "flex", justifyContent: "center" }}>
                <Loader2 className="animate-spin" size={20} />
              </div>
            ) : error ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--red)", fontSize: 13 }}>
                Failed to load notifications.
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                You have no notifications.
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={n.id} style={{ padding: "12px 20px", display: "flex", gap: 12, transition: "background 0.2s", background: n.read ? "transparent" : "rgba(168,85,247,0.05)", animationDelay: `${i * 50}ms` }} className="hover:bg-[rgba(255,255,255,0.02)] animate-fade-up">
                  <div style={{ marginTop: 2 }}>
                    {!n.read ? <Circle size={10} color="var(--purple)" fill="var(--purple)" /> : <Check size={12} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: n.isAnnouncement ? "var(--purple)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{n.title}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 600, color: n.read ? "var(--text-secondary)" : "var(--text-primary)", marginBottom: 4, lineHeight: 1.4 }}>
                      {n.link ? (
                        <Link href={n.link} onClick={() => { if (!n.read) markAsRead(n.id, n.isAnnouncement); setOpen(false); }} style={{ textDecoration: "none", color: "inherit" }}>
                          {n.message}
                        </Link>
                      ) : (
                        <span 
                          onClick={() => {
                            if (!n.read) markAsRead(n.id, n.isAnnouncement);
                            if (n.isAnnouncement) {
                              setExpandedId(expandedId === n.id ? null : n.id);
                            }
                          }} 
                          style={{ cursor: "pointer", display: "block" }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (!n.read) markAsRead(n.id, n.isAnnouncement);
                              if (n.isAnnouncement) setExpandedId(expandedId === n.id ? null : n.id);
                            }
                          }}
                        >
                          {n.message}
                        </span>
                      )}
                    </p>
                    {n.isAnnouncement && expandedId === n.id && n.content && (
                      <div style={{ marginTop: 8, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {n.content}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
