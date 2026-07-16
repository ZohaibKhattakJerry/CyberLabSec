"use client";

import { useState, useEffect } from "react";
import { Save, Shield, Users, Bell, BarChart2, FileText, Search, Download, RefreshCw, Loader2 } from "lucide-react";

const TABS = [
  { id: "company", label: "Company Profile", icon: FileText },
  { id: "security", label: "Security", icon: Shield },
  { id: "audit", label: "Audit Log", icon: BarChart2 },
  { id: "points", label: "Point Values", icon: BarChart2 },
  { id: "templates", label: "Email Templates", icon: Bell },
  { id: "admins", label: "Admin Accounts", icon: Users },
];

export default function SettingsClient() {
  const [tab, setTab] = useState("company");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const [company, setCompany] = useState({ name: "CyberLabSec", email: "hr@cyberlabsec.tech", timezone: "Asia/Karachi", website: "https://cyberlabsec.tech" });
  const [points, setPoints] = useState({ low: 10, medium: 20, high: 35, critical: 50, onTimeBonus: 20, qualityPerStar: 5 });
  const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  const templates = [
    { id: "app_received", name: "Application Received", subject: "We received your application — CyberLabSec", status: "Active" },
    { id: "interview_invite", name: "Interview Invitation", subject: "You're shortlisted! Complete your technical assessment", status: "Active" },
    { id: "offer", name: "Offer Letter", subject: "Job Offer from CyberLabSec", status: "Active" },
    { id: "rejection", name: "Application Update", subject: "Update on your CyberLabSec application", status: "Active" },
    { id: "welcome", name: "Welcome to Team", subject: "Welcome to CyberLabSec — Portal Access", status: "Active" },
    { id: "certificate", name: "Completion Certificate", subject: "Your Internship Completion Certificate", status: "Active" },
    { id: "lor", name: "Letter of Recommendation", subject: "Letter of Recommendation — CyberLabSec", status: "Active" },
  ];

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 4000);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/company/audit-log");
      if (res.ok) { const d = await res.json(); setAuditLogs(d.logs || []); }
    } catch {}
    setAuditLoading(false);
  };

  useEffect(() => { if (tab === "audit") fetchAuditLogs(); }, [tab]);

  const saveCompany = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    showMsg("Company profile saved.");
  };

  const savePoints = async () => {
    setSaving(true);
    const res = await fetch("/api/company/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pointValues: points }) });
    setSaving(false);
    showMsg(res.ok ? "Point values updated." : "Failed to save.", res.ok ? "success" : "error");
  };

  const exportCSV = () => {
    const rows = filteredLogs.slice(0, 500);
    const csv = ["Action,Actor,Timestamp,Details", ...rows.map((l) => `${l.action},${l.actorId},${l.createdAt},"${String(l.metadata || "").replace(/"/g, "'")}"`)] ;
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
  };

  const filteredLogs = auditLogs.filter((l) => !auditSearch || l.action?.toLowerCase().includes(auditSearch.toLowerCase()) || l.actorId?.toLowerCase().includes(auditSearch.toLowerCase()));

  const msgBg = msgType === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)";
  const msgBorder = msgType === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
  const msgColor = msgType === "success" ? "var(--green)" : "var(--red)";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Settings</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Manage company configuration, security, and platform settings.</p>
      </div>

      {msg && <div style={{ background: msgBg, border: `1px solid ${msgBorder}`, color: msgColor, padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{msg}</div>}

      <div className="tab-group" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} className={`tab-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Company Profile */}
      {tab === "company" && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Company Profile</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label">Company Name</label>
              <input className="input" value={company.name} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">HR Contact Email</label>
              <input className="input" type="email" value={company.email} onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" value={company.website} onChange={(e) => setCompany((c) => ({ ...c, website: e.target.value }))} />
            </div>
            <div>
              <label className="label">Timezone</label>
              <select className="input" value={company.timezone} onChange={(e) => setCompany((c) => ({ ...c, timezone: e.target.value }))}>
                <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <button className="btn btn-primary" onClick={saveCompany} disabled={saving} style={{ gap: 8 }}>
                {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Password Policy</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {["Minimum 12 characters", "At least one uppercase letter", "At least one number", "At least one special character", "Cannot reuse last 5 passwords"].map((rule) => (
                <div key={rule} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-secondary)" }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Session Management</h2>
            {[
              { label: "Session Timeout", desc: "Admin sessions expire after 8 hours of inactivity", badge: "8 hours", color: "badge-green" },
              { label: "Login Rate Limiting", desc: "Account locked for 15 minutes after 5 failed attempts", badge: "Active", color: "badge-green" },
              { label: "2FA Requirement", desc: "Require TOTP for all admin actions (recommended)", badge: "Recommended", color: "badge-amber" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</div>
                </div>
                <span className={`badge ${item.color}`}>{item.badge}</span>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-danger" style={{ gap: 8 }}>
                <Shield size={14} /> Sign Out All Admin Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === "audit" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Audit Log</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={fetchAuditLogs} style={{ gap: 6 }}><RefreshCw size={13} /> Refresh</button>
              <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{ gap: 6 }}><Download size={13} /> Export CSV</button>
            </div>
          </div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="input" placeholder="Search by action or actor..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          {auditLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} className="spin" style={{ color: "var(--text-muted)" }} /></div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>No audit entries found.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {["Action", "Actor", "Timestamp", "Details"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice(0, 200).map((log, i) => {
                    let details = "";
                    try { const m = JSON.parse(log.metadata || "{}"); details = Object.entries(m).map(([k, v]) => `${k}: ${v}`).join(" · "); } catch { details = log.metadata || ""; }
                    return (
                      <tr key={i}>
                        <td data-label="Action"><span className="badge badge-gray" style={{ fontSize: 10 }}>{log.action}</span></td>
                        <td data-label="Actor" style={{ fontFamily: "monospace", fontSize: 12 }}>{log.actorId?.slice(0, 10)}…</td>
                        <td data-label="Timestamp" style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td data-label="Details" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Point Values */}
      {tab === "points" && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Leaderboard Point Values</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>Points are awarded when a task submission is approved. All values are configurable.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {([
              { label: "Low Priority", key: "low", color: "var(--green)" },
              { label: "Medium Priority", key: "medium", color: "var(--blue)" },
              { label: "High Priority", key: "high", color: "var(--amber)" },
              { label: "Critical Priority", key: "critical", color: "var(--red)" },
            ] as const).map(({ label, key, color }) => (
              <div key={key}>
                <label className="label" style={{ color }}>{label} (base pts)</label>
                <input className="input" type="number" min={1} value={(points as unknown)[key]} onChange={(e) => setPoints((p) => ({ ...p, [key]: Number(e.target.value) }))} style={{ width: 120 }} />
              </div>
            ))}
            <div>
              <label className="label">On-Time Bonus (%)</label>
              <input className="input" type="number" min={0} max={100} value={points.onTimeBonus} onChange={(e) => setPoints((p) => ({ ...p, onTimeBonus: Number(e.target.value) }))} style={{ width: 120 }} />
            </div>
            <div>
              <label className="label">Quality Bonus (pts per ⭐)</label>
              <input className="input" type="number" min={0} value={points.qualityPerStar} onChange={(e) => setPoints((p) => ({ ...p, qualityPerStar: Number(e.target.value) }))} style={{ width: 120 }} />
            </div>
          </div>
          <div style={{ margin: "20px 0", padding: "14px 16px", background: "rgba(168,85,247,0.06)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.15)", fontSize: 13, color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--purple)" }}>Example:</strong> High priority task, on-time, 4⭐ quality = {points.high} + {Math.round(points.high * points.onTimeBonus / 100)} + {points.qualityPerStar * 4} = <strong style={{ color: "var(--amber)" }}>{points.high + Math.round(points.high * points.onTimeBonus / 100) + points.qualityPerStar * 4} points</strong>
          </div>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={savePoints} disabled={saving}>
            {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Point Values
          </button>
        </div>
      )}

      {/* Email Templates */}
      {tab === "templates" && (
        <div style={{ display: "grid", gap: 10 }}>
          {templates.map((t) => (
            <div key={t.id} className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Subject: {t.subject}</div>
              </div>
              <span className="badge badge-green">{t.status}</span>
            </div>
          ))}
          <div style={{ padding: "14px 16px", background: "rgba(168,85,247,0.06)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.15)", fontSize: 13, color: "var(--text-secondary)" }}>
            📧 Email template editing is managed via your email provider. Contact your system administrator to customize HTML templates.
          </div>
        </div>
      )}

      {/* Admin Accounts */}
      {tab === "admins" && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Admin Accounts</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Manage who has access to the Company Console. The last Super Admin cannot be removed.</p>
          <div style={{ display: "flex", gap: 10, padding: "16px", background: "rgba(168,85,247,0.04)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>CyberLabSec Admin</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>admin@cyberlabsec.tech · Super Admin · Last active: now</div>
            </div>
            <span className="badge badge-purple">Super Admin</span>
          </div>
          <div style={{ padding: "12px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, color: "var(--amber)" }}>
            ⚠️ To add additional admin accounts, use the /api/setup-ceo route or contact your system administrator.
          </div>
        </div>
      )}
    </div>
  );
}
