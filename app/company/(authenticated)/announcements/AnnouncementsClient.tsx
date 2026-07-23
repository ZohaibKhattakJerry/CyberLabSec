"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Plus, X, Loader2, Megaphone, Users, Building2, Send,
  Pin, Calendar, Bell, Eye, Trash2, Pencil, CheckCircle,
  UserCheck, ClipboardList, Briefcase, ActivityIcon, Clock,
  Info, Filter
} from "lucide-react";
import toast from "react-hot-toast";

type Announcement = {
  id: string; scope: string; message: string; sentAt: string;
  isPinned: boolean; expiresAt: string | null;
  sentBy: { name: string } | null;
  team: { name: string } | null;
  employee: { name: string } | null;
  readCount: number;
  readers: { name: string; employeeCode: string; readAt: string }[];
};

type Activity = {
  id: string;
  type: "task_submitted" | "task_assigned" | "team_created" | "member_added" | "leave_requested" | "employee_joined";
  title: string;
  description: string;
  time: string;
  employeeName?: string;
};

type Team = { id: string; name: string };
type Employee = { id: string; name: string; employeeCode: string };

const SCOPE_CONFIG = {
  Company:    { label: "Company-wide", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)", icon: "🏢" },
  Team:       { label: "Team",          color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)", icon: "👥" },
  Individual: { label: "Personal",      color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)", icon: "👤" },
};

const ACTIVITY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  task_submitted:  { icon: "✅", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  task_assigned:   { icon: "📋", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  team_created:    { icon: "🛡️", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  member_added:    { icon: "👤", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  leave_requested: { icon: "🗓️", color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  employee_joined: { icon: "🎉", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
};

export default function AnnouncementsClient({
  announcements: initialAnnouncements, teams, employees, totalEmployees, recentActivities = []
}: {
  announcements: Announcement[]; teams: Team[]; employees: Employee[]; totalEmployees: number;
  recentActivities?: Activity[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [activeTab, setActiveTab] = useState<"announcements" | "activity">("announcements");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedReaders, setExpandedReaders] = useState<string | null>(null);

  // Form state
  const [scope, setScope] = useState("Company");
  const [teamId, setTeamId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterScope, setFilterScope] = useState("All");

  const openCreate = () => {
    setEditingId(null); setMessage(""); setTitle(""); setIsPinned(false); setExpiresAt(""); setScope("Company"); setTeamId(""); setEmployeeId(""); setSendEmail(false);
    setShowModal(true);
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id); setMessage(a.message); setIsPinned(a.isPinned);
    setExpiresAt(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "");
    setShowModal(true);
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error("Message is required");
    if (scope === "Team" && !teamId) return toast.error("Select a team");
    if (scope === "Individual" && !employeeId) return toast.error("Select an employee");
    setLoading(true);
    try {
      const res = await fetch("/api/company/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, teamId: scope === "Team" ? teamId : null, employeeId: scope === "Individual" ? employeeId : null, message: message.trim(), sendEmail, isPinned, expiresAt: expiresAt || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("📢 Announcement sent successfully!");
      setShowModal(false);
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally { setLoading(false); }
  };

  const handleEditSave = async () => {
    if (!editingId || !message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/company/announcements/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, isPinned, expiresAt: expiresAt || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Announcement updated");
      setShowModal(false);
      startTransition(() => router.refresh());
    } catch { toast.error("Failed to update"); }
    finally { setLoading(false); }
  };

  const deleteAnn = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await fetch(`/api/company/announcements/${id}`, { method: "DELETE" });
      setAnnouncements(a => a.filter(x => x.id !== id));
      toast.success("Announcement deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = announcements.filter(a => filterScope === "All" || a.scope === filterScope);
  const pinnedAnnouncements = filtered.filter(a => a.isPinned);
  const unpinnedAnnouncements = filtered.filter(a => !a.isPinned);

  return (
    <>
      <style>{`
        .ann-page { padding-bottom: 60px; }
        .ann-header { background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 50%, transparent 100%); border: 1px solid rgba(99,102,241,0.15); border-radius: 24px; padding: clamp(18px,4vw,28px); margin-bottom: 24px; }
        .ann-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 4px; margin-bottom: 22px; }
        .ann-tab { display: flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.2s; white-space: nowrap; }
        .ann-tab-active { background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.2)); color: #a5b4fc; }
        .ann-tab-inactive { background: transparent; color: #6b7280; }
        .ann-tab-inactive:hover { background: rgba(255,255,255,0.06); color: #9ca3af; }

        .ann-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; transition: all 0.2s; }
        .ann-card:hover { border-color: rgba(99,102,241,0.25); }
        .ann-card-pinned { border-color: rgba(245,158,11,0.3) !important; box-shadow: 0 4px 20px rgba(245,158,11,0.06); }
        .ann-pin-bar { background: linear-gradient(90deg, rgba(245,158,11,0.15), transparent); padding: 6px 20px; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid rgba(245,158,11,0.1); }
        .ann-body { padding: clamp(14px,3vw,22px); }
        .ann-message { font-size: 14px; color: #d1d5db; line-height: 1.7; white-space: pre-wrap; padding: 14px 18px; border-radius: 12px; margin-bottom: 14px; }
        .ann-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }

        .ann-scope-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; border: 1px solid; }
        .ann-actions { display: flex; gap: 6px; }
        .ann-btn-icon { display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 6px 11px; cursor: pointer; font-size: 12px; font-weight: 600; color: #9ca3af; transition: all 0.2s; }
        .ann-btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .ann-btn-delete:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #f87171 !important; }

        .ann-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 500; display: flex; align-items: flex-end; justify-content: center; }
        @media (min-width: 640px) { .ann-modal-overlay { align-items: center; padding: 24px; } }
        .ann-modal { background: linear-gradient(180deg, #0e0d18, #090810); border: 1px solid rgba(99,102,241,0.2); border-radius: 28px 28px 0 0; width: 100%; max-width: 580px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 -20px 60px rgba(0,0,0,0.6); }
        @media (min-width: 640px) { .ann-modal { border-radius: 24px; } }
        .ann-modal-header { padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .ann-modal-body { padding: 20px 24px 24px; overflow-y: auto; flex: 1; display: grid; gap: 16px; }
        .ann-modal-footer { padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; gap: 10px; flex-shrink: 0; }
        .ann-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 13px; color: #fff; font-size: 14px; transition: all 0.2s; outline: none; }
        .ann-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.05); }
        .ann-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; display: block; }
        .ann-btn-primary { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 12px; padding: 11px 22px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .ann-btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .ann-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .ann-btn-secondary { display: flex; align-items: center; justify-content: center; gap: 7px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #9ca3af; border-radius: 12px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ann-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #d1d5db; }

        /* Activity feed */
        .act-item { display: flex; align-items: flex-start; gap: 13px; padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; transition: background 0.2s; }
        .act-item:hover { background: rgba(255,255,255,0.05); }
        .act-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }

        .read-chip { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); color: #34d399; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .read-chip-zero { background: rgba(107,114,128,0.1); border-color: rgba(107,114,128,0.2); color: #6b7280; cursor: default; }

        @keyframes annFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ann-fade { animation: annFade 0.35s ease both; }
      `}</style>

      <div className="ann-page ann-fade">
        {/* Header */}
        <div className="ann-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Megaphone size={18} style={{ color: "#a5b4fc" }} />
                </div>
                <h1 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Announcements</h1>
              </div>
              <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Broadcast messages to employees. Track acknowledgements and company activity.</p>
            </div>
            <button className="ann-btn-primary" onClick={openCreate} style={{ flexShrink: 0 }}>
              <Plus size={16} /> New Announcement
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Total", val: announcements.length, color: "#818cf8", bg: "rgba(99,102,241,0.1)" },
              { label: "Pinned", val: announcements.filter(a => a.isPinned).length, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              { label: "Company-wide", val: announcements.filter(a => a.scope === "Company").length, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
              { label: "Team", val: announcements.filter(a => a.scope === "Team").length, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
              { label: "Personal", val: announcements.filter(a => a.scope === "Individual").length, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "8px 14px", background: s.bg, borderRadius: 10, border: `1px solid ${s.color}30`, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="ann-tabs">
          {[
            { id: "announcements", label: "Announcements", icon: <Bell size={14} /> },
            { id: "activity", label: "Company Activity", icon: <ActivityIcon size={14} /> },
          ].map(tab => (
            <button key={tab.id} className={`ann-tab ${activeTab === tab.id ? "ann-tab-active" : "ann-tab-inactive"}`}
              onClick={() => setActiveTab(tab.id as any)}>
              {tab.icon} {tab.label}
            </button>
          ))}

          {activeTab === "announcements" && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <Filter size={13} style={{ color: "#6b7280" }} />
              {["All", "Company", "Team", "Individual"].map(s => (
                <button key={s} onClick={() => setFilterScope(s)}
                  style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: filterScope === s ? (SCOPE_CONFIG[s as keyof typeof SCOPE_CONFIG]?.bg || "rgba(99,102,241,0.2)") : "transparent", color: filterScope === s ? (SCOPE_CONFIG[s as keyof typeof SCOPE_CONFIG]?.color || "#a5b4fc") : "#6b7280", borderColor: filterScope === s ? (SCOPE_CONFIG[s as keyof typeof SCOPE_CONFIG]?.border || "rgba(99,102,241,0.3)") : "transparent" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── ANNOUNCEMENTS TAB ── */}
        {activeTab === "announcements" && (
          <div className="ann-fade" style={{ display: "grid", gap: 14 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📢</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Announcements Yet</h3>
                <p style={{ color: "#6b7280", fontSize: 13, maxWidth: 300, margin: "0 auto" }}>Create your first announcement to broadcast messages to employees.</p>
                <button className="ann-btn-primary" style={{ margin: "20px auto 0", display: "inline-flex" }} onClick={openCreate}><Plus size={15} /> Create Announcement</button>
              </div>
            ) : (
              <>
                {/* Pinned first */}
                {pinnedAnnouncements.map((a, i) => (
                  <AnnouncementCard key={a.id} a={a} onEdit={() => startEdit(a)} onDelete={() => deleteAnn(a.id)} expanded={expandedReaders === a.id} onToggleReaders={() => setExpandedReaders(expandedReaders === a.id ? null : a.id)} totalEmployees={totalEmployees} delay={i * 0.04} />
                ))}
                {unpinnedAnnouncements.map((a, i) => (
                  <AnnouncementCard key={a.id} a={a} onEdit={() => startEdit(a)} onDelete={() => deleteAnn(a.id)} expanded={expandedReaders === a.id} onToggleReaders={() => setExpandedReaders(expandedReaders === a.id ? null : a.id)} totalEmployees={totalEmployees} delay={(pinnedAnnouncements.length + i) * 0.04} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === "activity" && (
          <div className="ann-fade" style={{ display: "grid", gap: 12 }}>
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🌐</div>
                <p style={{ color: "#6b7280", fontSize: 13 }}>No recent activities to show.</p>
              </div>
            ) : (
              recentActivities.map((act, i) => {
                const cfg = ACTIVITY_ICONS[act.type] || { icon: "🔔", color: "#818cf8", bg: "rgba(129,140,248,0.1)" };
                return (
                  <div key={act.id} className="act-item" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="act-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#e5e7eb", marginBottom: 3 }}>{act.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{act.description}</div>
                    </div>
                    <div suppressHydrationWarning style={{ fontSize: 11, color: "#4b5563", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {formatDistanceToNow(new Date(act.time), { addSuffix: true })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className="ann-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ann-modal" onClick={e => e.stopPropagation()}>
            <div className="ann-modal-header">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {editingId ? <Pencil size={17} style={{ color: "#818cf8" }} /> : <Megaphone size={17} style={{ color: "#818cf8" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>{editingId ? "Edit Announcement" : "Create Announcement"}</h2>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                  {editingId ? "Update this announcement for employees." : "Broadcast a message to employees."}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px", color: "#6b7280", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            <div className="ann-modal-body">
              {/* Scope selector (only on create) */}
              {!editingId && (
                <>
                  <div>
                    <label className="ann-label">Target Audience</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {(["Company", "Team", "Individual"] as const).map(s => {
                        const c = SCOPE_CONFIG[s];
                        return (
                          <button key={s} type="button" onClick={() => setScope(s)}
                            style={{ padding: "10px 12px", borderRadius: 12, border: `2px solid ${scope === s ? c.border : "rgba(255,255,255,0.07)"}`, background: scope === s ? c.bg : "rgba(255,255,255,0.03)", color: scope === s ? c.color : "#6b7280", cursor: "pointer", fontWeight: 700, fontSize: 12, transition: "all 0.2s", textAlign: "center" }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {scope === "Team" && (
                    <div>
                      <label className="ann-label">Select Team</label>
                      <select className="ann-input" value={teamId} onChange={e => setTeamId(e.target.value)}>
                        <option value="">— Choose Team —</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}

                  {scope === "Individual" && (
                    <div>
                      <label className="ann-label">Select Employee</label>
                      <select className="ann-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                        <option value="">— Choose Employee —</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Message */}
              <div>
                <label className="ann-label">Message ✱</label>
                <textarea className="ann-input" value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder={`Type your ${scope === "Company" ? "company-wide" : scope === "Team" ? "team" : "personal"} announcement...`} style={{ resize: "vertical", fontFamily: "inherit" }} />
                <div style={{ textAlign: "right", fontSize: 11, color: message.length > 400 ? "#f87171" : "#4b5563", marginTop: 4 }}>{message.length}/500</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label className="ann-label">Expiry Date (optional)</label>
                  <input type="datetime-local" className="ann-input" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "flex-end", paddingBottom: 4 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} style={{ width: 15, height: 15, accentColor: "#f59e0b" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}>📌 Pin to dashboard</span>
                  </label>
                  {!editingId && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} style={{ width: 15, height: 15, accentColor: "#818cf8" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}>📧 Send via Email</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="ann-modal-footer">
              <button className="ann-btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="ann-btn-primary" style={{ flex: 2 }} onClick={editingId ? handleEditSave : handleSend} disabled={loading || !message.trim()}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : editingId ? <><CheckCircle size={15} /> Save Changes</> : <><Send size={15} /> Send Announcement</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Announcement Card Component ─────────────────────────────────────────────
function AnnouncementCard({
  a, onEdit, onDelete, expanded, onToggleReaders, totalEmployees, delay
}: {
  a: Announcement; onEdit: () => void; onDelete: () => void; expanded: boolean;
  onToggleReaders: () => void; totalEmployees: number; delay: number;
}) {
  const cfg = SCOPE_CONFIG[a.scope as keyof typeof SCOPE_CONFIG] || SCOPE_CONFIG.Company;
  const target = a.scope === "Team" ? `Team: ${a.team?.name}` : a.scope === "Individual" ? a.employee?.name || "Unknown" : "All Employees";

  return (
    <div className={`ann-card ${a.isPinned ? "ann-card-pinned" : ""}`} style={{ animationDelay: `${delay}s` }}>
      {a.isPinned && (
        <div className="ann-pin-bar">
          <Pin size={11} /> HIGH PRIORITY — PINNED
        </div>
      )}
      <div className="ann-body">
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: `1px solid ${cfg.border}` }}>
              {cfg.icon}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="ann-scope-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                  {a.scope === "Company" ? <Building2 size={10} /> : <Users size={10} />}
                  {cfg.label}
                </span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{target}</span>
                {a.isPinned && <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "2px 7px" }}>PINNED</span>}
                {a.expiresAt && <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 20, padding: "2px 7px" }}>Expires {format(new Date(a.expiresAt), "MMM d")}</span>}
              </div>
              <div suppressHydrationWarning style={{ fontSize: 11, color: "#4b5563", marginTop: 3 }}>
                {a.sentBy?.name || "System"} · {formatDistanceToNow(new Date(a.sentAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="ann-actions">
            <button className="ann-btn-icon" onClick={onEdit} title="Edit"><Pencil size={12} /> Edit</button>
            <button className="ann-btn-icon ann-btn-delete" onClick={onDelete} title="Delete"><Trash2 size={12} /></button>
          </div>
        </div>

        {/* Message body */}
        <div className="ann-message" style={{ borderLeft: `3px solid ${cfg.color}`, background: `${cfg.bg}` }}>
          {a.message}
        </div>

        {/* Footer: read tracking */}
        <div className="ann-footer">
          <div style={{ fontSize: 11, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> {format(new Date(a.sentAt), "MMM d, yyyy · h:mm a")}
          </div>
          <button onClick={onToggleReaders}
            className={`read-chip ${a.readCount === 0 ? "read-chip-zero" : ""}`}>
            <Eye size={11} />
            {a.readCount} acknowledged
            {a.scope === "Company" && ` / ${totalEmployees}`}
            {a.readCount > 0 && <span>{expanded ? "▲" : "▼"}</span>}
          </button>
        </div>

        {/* Expanded readers */}
        {expanded && a.readers.length > 0 && (
          <div style={{ marginTop: 12, padding: 14, background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", maxHeight: 200, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Acknowledged by</div>
            <div style={{ display: "grid", gap: 6 }}>
              {a.readers.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af" }}>
                  <span>{r.name} <span style={{ color: "#4b5563" }}>({r.employeeCode})</span></span>
                  <span style={{ color: "#4b5563" }}>{format(new Date(r.readAt), "MMM d, h:mm a")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
