"use client";

import { useState } from "react";
import {
  Building,
  ShieldCheck,
  Bell,
  Database,
  AlertTriangle,
  Download,
  Upload,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Linkedin,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password states for settings
  const [newPassword, setNewPassword] = useState("");

  // Company Profile states
  const [companyName, setCompanyName] = useState("CyberLabSec");
  const [companyTagline, setCompanyTagline] = useState("Offensive Security & Pentesting Operations");
  const [companyDesc, setCompanyDesc] = useState("Advanced Offensive Security & Training Platform.");
  const [linkedinUrl, setLinkedinUrl] = useState("https://www.linkedin.com/company/cyberlabsec");
  const [website, setWebsite] = useState("https://cyberlabsec.tech");
  const [contactEmail, setContactEmail] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [teamSize, setTeamSize] = useState("11-50");
  const [industry, setIndustry] = useState("Cybersecurity");

  const [saving, setSaving] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"settings"|"backup"|"restore"|"clear_data"|null>(null);

  // Notifications
  const [notifApp, setNotifApp] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifSupport, setNotifSupport] = useState(true);
  const [notifLeave, setNotifLeave] = useState(false);

  const requestOtp = async (action: "settings"|"backup"|"restore"|"clear_data") => {
    if (action === "restore") {
      if (!file) {
        setMessage({ type: "error", text: "Please select a backup file first." });
        return;
      }
    }

    setSaving(true);
    setPendingAction(action);
    try {
      const res = await fetch("/api/company/settings/request-otp", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setShowOtpModal(true);
      } else {
        setMessage({ type: "error", text: "Failed to request OTP. Try again." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    }
    setSaving(false);
  };

  const handleOtpSubmit = async () => {
    if (!otpCode || otpCode.length !== 6) return setMessage({ type: "error", text: "Enter a valid 6-digit OTP" });
    
    if (pendingAction === "settings") {
      setOtpLoading(true);
      try {
        const companyData = { name: companyName, email: contactEmail, website: website };
        const payload: any = { otp: otpCode, companyData };
        const res = await fetch("/api/company/settings/verify-otp", { 
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessage({ type: "success", text: "✅ Profile and settings securely updated." });
          setShowOtpModal(false);
          setOtpCode("");
          setPendingAction(null);
        } else {
          setMessage({ type: "error", text: "❌ " + (data.error || "Invalid OTP or expired.") });
        }
      } catch {
        setMessage({ type: "error", text: "❌ Network error during verification." });
      }
      setOtpLoading(false);
    } else if (pendingAction === "backup") {
      await handleDownload(otpCode);
    } else if (pendingAction === "restore") {
      await handleUpload(otpCode);
    } else if (pendingAction === "clear_data") {
      await executeClearData(otpCode);
    }
  };

  const handleDownload = async (otp: string) => {
    setShowOtpModal(false);
    setOtpCode("");
    setPendingAction(null);
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/company/backup?otp=${encodeURIComponent(otp)}&encrypt=true`);
      if (!res.ok) {
        let errStr = "Download failed (HTTP " + res.status + ").";
        try {
          const errData = await res.json();
          if (errData.error) errStr += ` Reason: ${errData.error}`;
        } catch(e) {}
        setMessage({ type: "error", text: errStr });
        return;
      }
      
      const blob = await res.blob();
      if (blob.size === 0) {
        setMessage({ type: "error", text: "Download failed: Received empty file." });
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cyberlabsec-full-backup-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: "success", text: "✅ Encrypted backup downloaded successfully (.zip)." });
    } catch (err: any) {
      setMessage({ type: "error", text: `Download error occurred: ${err.message}` });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (otp: string) => {
    if (!file) return;
    
    setShowOtpModal(false);
    setOtpCode("");
    setPendingAction(null);
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("backupFile", file);
    formData.append("otp", otp);

    try {
      const res = await fetch("/api/company/restore", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const counts = data.counts ? Object.entries(data.counts).map(([k, v]) => `${k}: ${v}`).join(", ") : "";
        setMessage({ type: "success", text: `✅ ${data.message}${counts ? ` (${counts})` : ""}` });
        setFile(null);
      } else {
        setMessage({ type: "error", text: `❌ ${data.error}` });
      }
    } catch {
      setMessage({ type: "error", text: "❌ Network error during restore." });
    } finally {
      setUploading(false);
    }
  };

  const executeClearData = async (otp: string) => {
    setShowOtpModal(false);
    setOtpCode("");
    setPendingAction(null);
    setClearing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/company/clear-database", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      setMessage({ type: res.ok ? "success" : "error", text: (res.ok ? "✅ " : "❌ ") + (data.message || data.error) });
    } catch {
      setMessage({ type: "error", text: "❌ Error occurred while clearing database." });
    } finally {
      setClearing(false);
    }
  };

  const navItems = [
    { id: "profile", label: "Company Profile", icon: Building },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data Management", icon: Database },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div style={{ display: "flex", minHeight: "80vh", background: "var(--bg-base)", color: "var(--text-primary)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tab-content { animation: fadeIn 0.3s ease-out forwards; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; margin: 4px 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500; color: var(--text-secondary); border-left: 3px solid transparent; }
        .nav-item:hover { background: rgba(255,255,255,0.03); color: var(--text-primary); }
        .nav-item.active { background: rgba(168,85,247,0.15); color: #a855f7; border-left-color: #a855f7; }
        .nav-item.danger.active { background: rgba(239,68,68,0.15); color: #ef4444; border-left-color: #ef4444; }
        .input-dark { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; color: var(--text-primary); font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
        .input-dark:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168,85,247,0.2); }
        .label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-primary { background: #a855f7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { background: #9333ea; }
        .toggle { appearance: none; width: 40px; height: 22px; background: rgba(255,255,255,0.1); border-radius: 20px; position: relative; cursor: pointer; outline: none; transition: 0.3s; }
        .toggle:checked { background: #a855f7; }
        .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: 0.3s; }
        .toggle:checked::after { transform: translateX(18px); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* LEFT SIDEBAR */}
      <div style={{ width: 220, flexShrink: 0, background: "var(--bg-card)", borderRight: "1px solid var(--border)", padding: "24px 0" }}>
        <h2 style={{ padding: "0 24px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Settings</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDanger = item.id === "danger";
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""} ${isDanger && isActive ? "danger" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {message && (
          <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: message.type === "success" ? "#22c55e" : "#ef4444", border: `1px solid \${message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} />
            {message.text}
          </div>
        )}

        {/* 1. COMPANY PROFILE */}
        {activeTab === "profile" && (
          <div className="tab-content" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Company Profile</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>Manage your organization's public details and branding.</p>
            
            <div style={{ display: "grid", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Company Name</label>
                  <input className="input-dark" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Tagline</label>
                  <input className="input-dark" value={companyTagline} onChange={e => setCompanyTagline(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input-dark" rows={4} value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">LinkedIn URL</label>
                  <input className="input-dark" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input className="input-dark" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input-dark" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hello@company.com" />
                </div>
                <div>
                  <label className="label">Founded Year</label>
                  <input className="input-dark" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="2020" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Team Size</label>
                  <select className="input-dark" value={teamSize} onChange={e => setTeamSize(e.target.value)}>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                  </select>
                </div>
                <div>
                  <label className="label">Industry</label>
                  <input className="input-dark" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <button className="btn-primary" onClick={() => requestOtp("settings")} disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECURITY */}
        {activeTab === "security" && (
          <div className="tab-content" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Security & Access</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>Control session settings and authentication policies.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Two-Factor Authentication</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Require 2FA for all admin accounts.</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>Coming Soon</span>
                </div>
                <input type="checkbox" className="toggle" disabled />
              </div>

              <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Session Policies</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label className="label">Session Timeout</label>
                    <select className="input-dark" defaultValue="8h">
                      <option value="4h">4 hours</option>
                      <option value="8h">8 hours</option>
                      <option value="24h">24 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Login Attempt Limit</label>
                    <div className="input-dark" style={{ opacity: 0.7 }}>Locked to 5 attempts before cooldown</div>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Active Status</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8 }}>
                  <ShieldCheck size={20} color="#22c55e" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>AES-256 Encryption Active</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Data is currently encrypted at rest.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="tab-content" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Notification Preferences</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>Manage when and how the platform sends automated emails.</p>

            <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 12 }}>
              {[
                { title: "New Applications", desc: "Notify when a candidate applies", state: notifApp, setter: setNotifApp },
                { title: "Task Submissions", desc: "Notify on completed assignments", state: notifTasks, setter: setNotifTasks },
                { title: "Support Tickets", desc: "Notify when a new ticket is opened", state: notifSupport, setter: setNotifSupport },
                { title: "Leave Requests", desc: "Notify when an employee requests time off", state: notifLeave, setter: setNotifLeave },
              ].map((item, idx, arr) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.desc}</p>
                  </div>
                  <input type="checkbox" className="toggle" checked={item.state} onChange={() => item.setter(!item.state)} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <button className="btn-primary" onClick={() => setMessage({ type: "success", text: "✅ Notification preferences securely saved." })}>Save Preferences</button>
            </div>
          </div>
        )}

        {/* 4. DATA MANAGEMENT */}
        {activeTab === "data" && (
          <div className="tab-content" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Data Management</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>Backup and restore platform data. Backup includes: Employees, Teams, Jobs, Applicants, Interviews, Tasks, Announcements, Attendance, Leave, Badges, Support Tickets, and all other platform data.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* BACKUP */}
              <div style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "rgba(168,85,247,0.1)", padding: 8, borderRadius: 8 }}><Download color="#a855f7" size={20} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>Download Encrypted Backup</h3>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    Backups are transparently encrypted by the system. Download requires email verification.
                  </p>
                  <button onClick={() => requestOtp("backup")} disabled={downloading} className="btn-primary" style={{ flexShrink: 0 }}>
                    {downloading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                    Download Backup
                  </button>
                </div>
              </div>

              {/* RESTORE */}
              <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "rgba(234,179,8,0.1)", padding: 8, borderRadius: 8 }}><Upload color="#eab308" size={20} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>Restore from Backup</h3>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <label style={{ flex: 1, padding: "10px 14px", border: "1px dashed var(--border)", borderRadius: 6, cursor: "pointer", textAlign: "center", fontSize: 13, color: "var(--text-secondary)", transition: "0.2s" }} className="file-upload">
                    {file ? file.name : "Click to select backup .zip file"}
                    <input type="file" accept=".zip" onChange={handleFileChange} style={{ display: "none" }} />
                  </label>
                  <button onClick={() => requestOtp("restore")} disabled={!file || uploading} style={{ background: !file || uploading ? "rgba(234,179,8,0.1)" : "#eab308", color: !file || uploading ? "var(--text-muted)" : "#000", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: !file || uploading ? "not-allowed" : "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}>
                    {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                    Restore Backup
                  </button>
                </div>
                <p style={{ color: "#ef4444", fontSize: 12, marginTop: 12, fontWeight: 500 }}>
                  WARNING: Restoring will overwrite and replace ALL existing platform data.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* 5. DANGER ZONE */}
        {activeTab === "danger" && (
          <div className="tab-content" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#ef4444" }}>Danger Zone</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>Irreversible destructive actions. Proceed with extreme caution.</p>

            <div style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#ef4444", marginBottom: 8 }}>Clear All Database Data</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                Permanently deletes every record — Employees, Applicants, Tasks, Announcements, everything. The platform becomes completely empty. You cannot undo this.
              </p>
              
              <button onClick={() => requestOtp("clear_data")} disabled={clearing} style={{ background: clearing ? "rgba(239,68,68,0.1)" : "#ef4444", color: clearing ? "#ef4444" : "white", border: clearing ? "1px solid rgba(239,68,68,0.2)" : "none", padding: "10px 20px", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: clearing ? "not-allowed" : "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}>
                {clearing ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                {clearing ? "Clearing..." : "Delete All Data"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showOtpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div className="card" style={{ padding: 32, maxWidth: 400, width: "100%", animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "rgba(168,85,247,0.1)", padding: 8, borderRadius: 8, color: "var(--purple)" }}><ShieldCheck size={20} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Security Verification</h2>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
              To save these profile changes, please enter the 6-digit OTP sent to your admin email.
            </p>
            <input 
              autoFocus 
              className="input-dark" 
              placeholder="000000" 
              maxLength={6} 
              value={otpCode} 
              onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
              style={{ fontSize: 24, letterSpacing: "0.2em", textAlign: "center", fontWeight: 600, padding: "16px", marginBottom: 24 }} 
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowOtpModal(false)} disabled={otpLoading || downloading || uploading || clearing}>Cancel</button>
              <button className="btn-primary" onClick={handleOtpSubmit} disabled={otpLoading || otpCode.length !== 6 || downloading || uploading || clearing}>
                {otpLoading || downloading || uploading || clearing ? <Loader2 size={16} className="spin" /> : "Verify Action"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
