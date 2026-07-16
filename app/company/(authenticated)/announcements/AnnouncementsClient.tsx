"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X, Loader2, Megaphone, Users, Building2 } from "lucide-react";

type Announcement = {
  id: string; scope: string; message: string; sentAt: string;
  isPinned: boolean; expiresAt: string | null;
  sentBy: { name: string };
  team: { name: string } | null;
  employee: { name: string } | null;
  readCount: number;
  readers: { name: string; employeeCode: string; readAt: string }[];
};

type Team = { id: string; name: string };
type Employee = { id: string; name: string; employeeCode: string };

export default function AnnouncementsClient({ announcements, teams, employees, totalEmployees }: { announcements: Announcement[]; teams: Team[]; employees: Employee[]; totalEmployees: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedReaders, setExpandedReaders] = useState<string | null>(null);
  const [scope, setScope] = useState("Company");
  const [teamId, setTeamId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSend = async () => {
    if (!message.trim()) { setMsg("Message is required."); return; }
    if (scope === "Team" && !teamId) { setMsg("Please select a team."); return; }
    if (scope === "Individual" && !employeeId) { setMsg("Please select an employee."); return; }

    setLoading(true); setMsg("");
    const res = await fetch("/api/company/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        scope, 
        teamId: scope === "Team" ? teamId : null, 
        employeeId: scope === "Individual" ? employeeId : null,
        message, 
        sendEmail,
        isPinned,
        expiresAt: expiresAt || null
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed to send"); return; }
    
    setScope("Company"); setTeamId(""); setEmployeeId(""); setMessage(""); setSendEmail(false); setIsPinned(false); setExpiresAt(""); setShowCreate(false);
    startTransition(() => router.refresh());
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setLoading(true);
    await fetch(`/api/company/announcements/${id}`, { method: "DELETE" });
    setLoading(false);
    startTransition(() => router.refresh());
  };

  const handleEditSave = async () => {
    if (!editingId || !message.trim()) return;
    setLoading(true); setMsg("");
    const res = await fetch(`/api/company/announcements/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, isPinned, expiresAt: expiresAt || null }),
    });
    setLoading(false);
    if (!res.ok) { setMsg("Failed to update"); return; }
    setEditingId(null); setMessage(""); setIsPinned(false); setExpiresAt(""); setShowCreate(false);
    startTransition(() => router.refresh());
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setMessage(a.message);
    setIsPinned(a.isPinned);
    setExpiresAt(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0,16) : "");
    setShowCreate(true);
  };

  return (
    <div>
      <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Announcements</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Broadcast messages to employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setMessage(""); setIsPinned(false); setExpiresAt(""); setShowCreate(true); }}><Plus size={16} /> New Announcement</button>
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <Megaphone size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>No announcements sent yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {announcements.map((a) => (
            <div key={a.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`badge ${a.scope === "Company" ? "badge-blue" : a.scope === "Team" ? "badge-purple" : "badge-amber"}`}>
                    {a.scope === "Company" ? <Building2 size={12} /> : a.scope === "Team" ? <Users size={12} /> : <Users size={12} />}
                    {a.scope === "Company" ? "Company-wide" : a.scope === "Team" ? `Team: ${a.team?.name}` : `Individual: ${a.employee?.name}`}
                  </span>
                  {a.isPinned && <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Pinned</span>}
                  {a.expiresAt && <span className="badge" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>Expires: {format(new Date(a.expiresAt), "MMM d")}</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                  <div>Sent by {a.sentBy.name}</div>
                  <div>{format(new Date(a.sentAt), "MMM d, yyyy h:mm a")}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(a)} disabled={loading}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteAnnouncement(a.id)} disabled={loading}>Delete</button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", borderLeft: "3px solid var(--border-accent)", paddingLeft: 16 }}>
                {a.message}
              </div>
              {/* Acknowledgement tracking with expandable reader list */}
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => setExpandedReaders(expandedReaders === a.id ? null : a.id)}
                  style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, border: `1px solid ${a.readCount > 0 ? "rgba(34,197,94,0.25)" : "var(--border-subtle)"}`, background: a.readCount > 0 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", color: a.readCount > 0 ? "var(--green)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}
                >
                  👁 {a.readCount} acknowledged{a.scope === "Company" ? ` / ${totalEmployees} employees` : ""} {a.readCount > 0 ? (expandedReaders === a.id ? "▲" : "▼") : ""}
                </button>
                {expandedReaders === a.id && a.readers.length > 0 && (
                  <div style={{ marginTop: 8, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Read by</div>
                    <div style={{ display: "grid", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                      {a.readers.map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
                          <span>{r.name} <span style={{ color: "var(--text-muted)" }}>({r.employeeCode})</span></span>
                          <span style={{ color: "var(--text-muted)" }}>{format(new Date(r.readAt), "MMM d, h:mm a")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 540, width: "100%", padding: 32 }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editingId ? "Edit Announcement" : "Create Announcement"}</h2>
              <button onClick={() => { setShowCreate(false); setEditingId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {!editingId && (
                <div>
                  <label className="label">Target Scope</label>
                  <select className="input" value={scope} onChange={e => setScope(e.target.value)}>
                    <option value="Company">Company-wide (All Employees)</option>
                    <option value="Team">Specific Team</option>
                    <option value="Individual">Specific Employee</option>
                  </select>
                </div>
              )}
                {!editingId && scope === "Team" && (
                <div>
                  <label className="label">Select Team</label>
                  <select className="input" value={teamId} onChange={e => setTeamId(e.target.value)}>
                    <option value="">-- Choose Team --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              {!editingId && scope === "Individual" && (
                <div>
                  <label className="label">Select Employee</label>
                  <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
                  </select>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Expiry Date (Optional)</label>
                  <input type="datetime-local" className="input" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="label">Message</label>
                <textarea className="input" value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Type announcement here..." />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="pinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} />
                <label htmlFor="pinned" style={{ fontSize: 13 }}>Pin to top of employee dashboard</label>
              </div>
              {!editingId && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="email" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
                  <label htmlFor="email" style={{ fontSize: 13 }}>Also send via Email</label>
                </div>
              )}
              {msg && <p style={{ fontSize: 13, color: "var(--red)" }}>{msg}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCreate(false); setEditingId(null); }} disabled={loading}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={editingId ? handleEditSave : handleSend} disabled={loading}>
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : editingId ? "Save Changes" : "Send Announcement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
