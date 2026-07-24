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
  const [newPassword, setNewPassword] = useState("");
  const [points, setPoints] = useState({ low: 10, medium: 20, high: 35, critical: 50, onTimeBonus: 20, qualityPerStar: 5 });
  const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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

  const requestOtp = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/company/settings/request-otp", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: company.email })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowOtpModal(true);
      } else {
        showMsg(data.error || "Failed to request OTP. Try again.", "error");
      }
    } catch {
      showMsg("Network error. Try again.", "error");
    }
    setSaving(false);
  };

  const verifyOtpAndSave = async () => {
    if (!otpCode || otpCode.length !== 6) return showMsg("Enter a valid 6-digit OTP", "error");
    setOtpLoading(true);
    try {
      const payload: any = { otp: otpCode, companyData: company };
      if (newPassword) payload.newPassword = newPassword;
      
      const res = await fetch("/api/company/settings/verify-otp", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        showMsg("Profile and settings securely updated.");
        setShowOtpModal(false);
        setOtpCode("");
        setNewPassword("");
      } else {
        showMsg(data.error || "Invalid OTP or expired.", "error");
      }
    } catch {
      showMsg("Network error during verification.", "error");
    }
    setOtpLoading(false);
  };

  const savePoints = async () => {
    setSaving(true);
    const res = await fetch("/api/company/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pointValues: points }) });
    setSaving(false);
    showMsg(res.ok ? "Point values updated." : "Failed to save.", res.ok ? "success" : "error");
  };

  const exportCSV = () => {
    const rows = filteredLogs.slice(0, 500);
    const csv = ["Action,Actor,Timestamp,Details", ...rows.map((l: any) => `${l.action},${l.actorId},${l.createdAt},"${String(l.metadata || "").replace(/"/g, "'")}"`)] ;
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
  };

  const filteredLogs = auditLogs.filter((l) => !auditSearch || l.action?.toLowerCase().includes(auditSearch.toLowerCase()) || l.actorId?.toLowerCase().includes(auditSearch.toLowerCase()));

  const msgBg = msgType === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)";
  const msgBorder = msgType === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
  const msgColor = msgType === "success" ? "var(--green)" : "var(--red)";

  return (
    <div className="settings-container">
      <style>{`
        .settings-container {
          animation: fadeSlideIn 0.4s ease-out;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .settings-header {
          margin-bottom: 24px;
        }
        .settings-title {
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .settings-subtitle {
          color: var(--text-secondary);
          font-size: clamp(13px, 2vw, 15px);
          max-width: 600px;
          line-height: 1.5;
        }

        .settings-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .settings-tabs::-webkit-scrollbar { display: none; }
        .settings-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .settings-tab:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
        }
        .settings-tab.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15));
          border-color: rgba(168,85,247,0.3);
          color: #fff;
          box-shadow: 0 4px 15px rgba(168,85,247,0.15);
        }

        .settings-card {
          background: rgba(15,15,20,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .settings-card-title {
          font-size: clamp(16px, 3vw, 18px);
          font-weight: 800;
          margin-bottom: 24px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .settings-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .settings-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .settings-input {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          font-size: 14px;
          transition: all 0.2s;
        }
        .settings-input:focus {
          border-color: rgba(168,85,247,0.5);
          background: rgba(0,0,0,0.4);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.15);
          outline: none;
        }

        .settings-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .settings-btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 15px rgba(99,102,241,0.3);
        }
        .settings-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.4);
        }
        .settings-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-alert {
          padding: 16px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          animation: fadeSlideIn 0.3s ease-out;
        }
        
        .settings-mobile-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .settings-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: background 0.2s;
        }
        .settings-list-item:hover {
          background: rgba(255,255,255,0.05);
        }
        
        @media (max-width: 640px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .settings-list-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .settings-list-item > div {
            width: 100%;
          }
          .settings-list-item > span {
            align-self: flex-start;
          }
          .settings-table-wrapper {
            overflow-x: auto;
            margin: 0 -20px;
            padding: 0 20px;
          }
        }
      `}</style>
      
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage company configuration, security, and platform settings with elite precision.</p>
      </div>

      {msg && (
        <div className="settings-alert" style={{ background: msgBg, border: `1px solid ${msgBorder}`, color: msgColor }}>
          {msgType === 'success' ? <Shield size={18} /> : <BarChart2 size={18} />}
          {msg}
        </div>
      )}

      <div className="settings-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`settings-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* Company Profile */}
      {tab === "company" && (
        <div className="settings-card">
          <h2 className="settings-card-title"><FileText className="ob-icon-purple" size={22} /> Company Profile</h2>
          <div className="settings-grid">
            <div className="settings-input-group" style={{ gridColumn: "1/-1" }}>
              <label className="settings-label">Company Name</label>
              <input className="settings-input" value={company.name} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">HR Contact Email</label>
              <input className="settings-input" type="email" value={company.email} onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">Website</label>
              <input className="settings-input" value={company.website} onChange={(e) => setCompany((c) => ({ ...c, website: e.target.value }))} />
            </div>
            <div className="settings-input-group">
              <label className="settings-label">Timezone</label>
              <select className="settings-input" value={company.timezone} onChange={(e) => setCompany((c) => ({ ...c, timezone: e.target.value }))}>
                <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div className="settings-input-group">
              <label className="settings-label">Change Admin Password</label>
              <input className="settings-input" type="password" placeholder="Leave blank to keep current" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1", marginTop: 12 }}>
              <button className="settings-btn settings-btn-primary" onClick={requestOtp} disabled={saving} style={{ width: "100%", maxWidth: "300px" }}>
                {saving ? <Loader2 size={16} className="spin" /> : <Shield size={16} />} Save Profile (Requires OTP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ padding: 24, width: 400, maxWidth: "90%", background: "#fff", border: "1px solid var(--border)", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={18} style={{ color: "var(--brand)" }} /> Verify Action
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              To protect sensitive company settings, we've sent a 6-digit OTP to your verified email: <strong>mrzohaibkhattak@gmail.com</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Enter 6-Digit OTP</label>
              <input 
                className="input" 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                style={{ fontSize: 24, letterSpacing: 4, textAlign: "center", padding: "12px 16px" }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowOtpModal(false)} disabled={otpLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={verifyOtpAndSave} disabled={otpLoading || otpCode.length !== 6}>
                {otpLoading ? <Loader2 size={14} className="spin" /> : "Verify & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="settings-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="settings-card">
            <h2 className="settings-card-title"><Shield className="ob-icon-blue" size={22} /> Password Policy</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {["Minimum 12 characters length required", "Must contain at least one uppercase letter", "Must contain at least one number", "Must contain at least one special character", "Cannot reuse any of the last 5 passwords"].map((rule) => (
                <div key={rule} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", flexShrink: 0, boxShadow: "0 0 10px var(--green)" }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="settings-card">
            <h2 className="settings-card-title"><Users className="ob-icon-purple" size={22} /> Session Management</h2>
            <div className="settings-mobile-list">
              {[
                { label: "Admin Session Timeout", desc: "Admin sessions expire after 8 hours of inactivity", badge: "8 hours", color: "badge-green" },
                { label: "Login Rate Limiting", desc: "Account locked for 15 minutes after 5 failed attempts", badge: "Active", color: "badge-green" },
                { label: "2FA Requirement", desc: "Require TOTP for all administrative actions", badge: "Recommended", color: "badge-amber" },
              ].map((item) => (
                <div key={item.label} className="settings-list-item">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{item.desc}</div>
                  </div>
                  <span className={`badge ${item.color}`} style={{ padding: "6px 12px", fontSize: 11 }}>{item.badge}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="settings-btn" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", width: "100%", maxWidth: "300px" }}>
                <Shield size={16} /> Sign Out All Admin Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === "audit" && (
        <div className="settings-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h2 className="settings-card-title" style={{ margin: 0 }}><BarChart2 className="ob-icon-purple" size={22} /> Audit Log</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="settings-btn" style={{ background: "rgba(255,255,255,0.05)", color: "#d1d5db", padding: "8px 16px" }} onClick={fetchAuditLogs}><RefreshCw size={14} /> Refresh</button>
                <button className="settings-btn" style={{ background: "rgba(255,255,255,0.05)", color: "#d1d5db", padding: "8px 16px" }} onClick={exportCSV}><Download size={14} /> Export CSV</button>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="settings-input" placeholder="Search by action or actor..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} style={{ paddingLeft: 46 }} />
            </div>
          </div>
          
          {auditLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}><Loader2 size={32} className="spin" style={{ color: "var(--purple)", margin: "0 auto" }} /></div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state" style={{ background: "rgba(0,0,0,0.2)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}>
              <div className="empty-state-icon-wrapper" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                <Search size={32} />
              </div>
              <div className="empty-state-title" style={{ color: "#fff" }}>No audit entries found</div>
              <div className="empty-state-description">We couldn't find any audit logs matching your criteria.</div>
            </div>
          ) : (
            <div className="settings-table-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    {["Action", "Actor", "Timestamp", "Details"].map((h) => (
                      <th key={h} style={{ padding: "16px 12px", color: "var(--text-secondary)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice(0, 200).map((log: any, i: number) => {
                    let details = "";
                    try { const m = JSON.parse(log.metadata || "{}"); details = Object.entries(m).map(([k, v]) => `${k}: ${v}`).join(" · "); } catch { details = log.metadata || ""; }
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover:bg-white/5">
                        <td style={{ padding: "16px 12px" }}><span className="badge badge-gray" style={{ fontSize: 11, padding: "4px 10px" }}>{log.action}</span></td>
                        <td style={{ padding: "16px 12px", fontFamily: "monospace", fontSize: 13, color: "#d1d5db" }}>{log.actorId?.slice(0, 10)}…</td>
                        <td style={{ padding: "16px 12px", color: "var(--text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: "16px 12px", color: "#9ca3af", fontSize: 13, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{details}</td>
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
        <div className="settings-card">
          <h2 className="settings-card-title"><BarChart2 className="ob-icon-amber" size={22} /> Leaderboard Point Values</h2>
          <p className="settings-subtitle" style={{ marginBottom: 28 }}>Points are awarded when a task submission is approved. Customize the baseline and bonus values here to fit your team's velocity.</p>
          
          <div className="settings-grid">
            {([
              { label: "Low Priority", key: "low", color: "var(--green)" },
              { label: "Medium Priority", key: "medium", color: "var(--blue)" },
              { label: "High Priority", key: "high", color: "var(--amber)" },
              { label: "Critical Priority", key: "critical", color: "var(--red)" },
            ] as const).map(({ label, key, color }: any) => (
              <div key={key} className="settings-input-group">
                <label className="settings-label" style={{ color }}>{label} (Base)</label>
                <div style={{ position: "relative" }}>
                  <input className="settings-input" type="number" min={1} value={(points as unknown)[key]} onChange={(e) => setPoints((p) => ({ ...p, [key]: Number(e.target.value) }))} style={{ paddingLeft: 40 }} />
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color, fontWeight: 700 }}>Pts</span>
                </div>
              </div>
            ))}
            <div className="settings-input-group">
              <label className="settings-label" style={{ color: "var(--purple)" }}>On-Time Bonus (%)</label>
              <div style={{ position: "relative" }}>
                <input className="settings-input" type="number" min={0} max={100} value={points.onTimeBonus} onChange={(e) => setPoints((p) => ({ ...p, onTimeBonus: Number(e.target.value) }))} style={{ paddingLeft: 40 }} />
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--purple)", fontWeight: 700 }}>%</span>
              </div>
            </div>
            <div className="settings-input-group">
              <label className="settings-label" style={{ color: "var(--blue)" }}>Quality Bonus (Per ⭐)</label>
              <div style={{ position: "relative" }}>
                <input className="settings-input" type="number" min={0} value={points.qualityPerStar} onChange={(e) => setPoints((p) => ({ ...p, qualityPerStar: Number(e.target.value) }))} style={{ paddingLeft: 40 }} />
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--blue)", fontWeight: 700 }}>⭐</span>
              </div>
            </div>
          </div>
          
          <div style={{ margin: "28px 0", padding: "16px 20px", background: "rgba(168,85,247,0.06)", borderRadius: 14, border: "1px solid rgba(168,85,247,0.15)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><BarChart2 size={16} color="var(--purple)" /><strong style={{ color: "var(--purple)", fontSize: 15 }}>Scoring Calculation Example</strong></div>
            A <strong>High Priority</strong> task submitted <strong>On-time</strong> with a <strong>4⭐</strong> rating will yield: <br/>
            {points.high} (base) + {Math.round(points.high * points.onTimeBonus / 100)} (on-time bonus) + {points.qualityPerStar * 4} (quality bonus) = <strong style={{ color: "#fff", background: "rgba(245,158,11,0.2)", padding: "2px 8px", borderRadius: 8 }}>{points.high + Math.round(points.high * points.onTimeBonus / 100) + points.qualityPerStar * 4} Total Points</strong>
          </div>
          
          <button className="settings-btn settings-btn-primary" onClick={savePoints} disabled={saving} style={{ width: "100%", maxWidth: "300px" }}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save Point Configuration
          </button>
        </div>
      )}

      {/* Email Templates */}
      {tab === "templates" && (
        <div className="settings-card">
          <h2 className="settings-card-title"><Bell className="ob-icon-purple" size={22} /> Email Templates</h2>
          <div className="settings-mobile-list">
            {templates.map((t: any) => (
              <div key={t.id} className="settings-list-item">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Subject: {t.subject}</div>
                </div>
                <span className="badge badge-green" style={{ padding: "6px 12px", fontSize: 11 }}>{t.status}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(168,85,247,0.06)", borderRadius: 14, border: "1px solid rgba(168,85,247,0.15)", fontSize: 14, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: 10, background: "rgba(168,85,247,0.1)", borderRadius: 10 }}><FileText size={20} color="var(--purple)" /></div>
            <span>Email template HTML editing is managed via your email provider interface. Contact your system administrator for direct HTML overrides.</span>
          </div>
        </div>
      )}

      {/* Admin Accounts */}
      {tab === "admins" && (
        <div className="settings-card">
          <h2 className="settings-card-title"><Users className="ob-icon-blue" size={22} /> Admin Accounts</h2>
          <p className="settings-subtitle" style={{ marginBottom: 24 }}>Manage who has root-level access to the CyberLabSec Company Console. The last Super Admin cannot be removed.</p>
          
          <div className="settings-mobile-list" style={{ marginBottom: 20 }}>
            <div className="settings-list-item" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 15px rgba(168,85,247,0.3)" }}>AD</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>CyberLabSec Admin</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>admin@cyberlabsec.tech · Last active: <strong style={{ color: "var(--green)" }}>now</strong></div>
                </div>
              </div>
              <span className="badge badge-purple" style={{ padding: "6px 12px", fontSize: 11, fontWeight: 800 }}>SUPER ADMIN</span>
            </div>
          </div>
          
          <div style={{ padding: "16px 20px", background: "rgba(245,158,11,0.06)", borderRadius: 14, border: "1px dashed rgba(245,158,11,0.3)", fontSize: 14, color: "var(--amber)", display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={20} />
            <span>To securely provision additional admin accounts, use the secure <strong>/api/setup-ceo</strong> CLI route or contact your system administrator.</span>
          </div>
        </div>
      )}
    </div>
  );
}
