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

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Company Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Manage your organization's configuration, security, and data.</p>
        </div>
      </div>

      {message && (
        <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: message.type === "success" ? "#22c55e" : "#ef4444", border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} />
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 24, alignItems: "start" }}>
        
        {/* Left Column */}
        <div style={{ display: "grid", gap: 24 }}>
          
          {/* 1. COMPANY PROFILE */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <Building size={16} color="var(--blue)" /> Company Profile
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label">Company Name</label>
                <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ borderRadius: 8 }} />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input className="input" value={companyTagline} onChange={e => setCompanyTagline(e.target.value)} style={{ borderRadius: 8 }} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} style={{ borderRadius: 8, minHeight: 80 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">LinkedIn URL</label>
                  <input className="input" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} style={{ borderRadius: 8 }} />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input className="input" value={website} onChange={e => setWebsite(e.target.value)} style={{ borderRadius: 8 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hello@company.com" style={{ borderRadius: 8 }} />
                </div>
                <div>
                  <label className="label">Founded Year</label>
                  <input className="input" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="2020" style={{ borderRadius: 8 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Team Size</label>
                  <select className="input" value={teamSize} onChange={e => setTeamSize(e.target.value)} style={{ borderRadius: 8 }}>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                  </select>
                </div>
                <div>
                  <label className="label">Industry</label>
                  <input className="input" value={industry} onChange={e => setIndustry(e.target.value)} style={{ borderRadius: 8 }} />
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => requestOtp("settings")} disabled={saving} style={{ marginTop: 8, height: 40, transition: "all 0.2s" }}>
                {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : "Save Profile"}
              </button>
            </div>
          </div>

          {/* 3. NOTIFICATIONS */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <Bell size={16} color="var(--amber)" /> Notification Preferences
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { title: "New Applications", desc: "Notify when a candidate applies", state: notifApp, setter: setNotifApp },
                { title: "Task Submissions", desc: "Notify on completed assignments", state: notifTasks, setter: setNotifTasks },
                { title: "Support Tickets", desc: "Notify when a new ticket is opened", state: notifSupport, setter: setNotifSupport },
                { title: "Leave Requests", desc: "Notify when an employee requests time off", state: notifLeave, setter: setNotifLeave },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.desc}</div>
                  </div>
                  <input type="checkbox" className="toggle" checked={item.state} onChange={() => item.setter(!item.state)} />
                </div>
              ))}
              <button className="btn btn-secondary" onClick={() => setMessage({ type: "success", text: "✅ Notification preferences securely saved." })} style={{ marginTop: 8, height: 40 }}>Save Preferences</button>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          
          {/* 2. SECURITY */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <ShieldCheck size={16} color="var(--green)" /> Security & Access
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Require 2FA for all admin accounts.</div>
                </div>
                <span className="badge badge-purple" style={{ marginLeft: 12 }}>Coming Soon</span>
              </div>
              
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Session Policies</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">Session Timeout</label>
                    <select className="input" defaultValue="8h" style={{ borderRadius: 8 }}>
                      <option value="4h">4 hours</option>
                      <option value="8h">8 hours</option>
                      <option value="24h">24 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Login Attempt Limit</label>
                    <div className="input" style={{ opacity: 0.7, borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Locked to 5 attempts</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12 }}>
                <ShieldCheck size={24} color="#22c55e" flexShrink={0} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>AES-256 Encryption Active</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Data is currently encrypted at rest.</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. DATA MANAGEMENT */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <Database size={16} color="var(--purple)" /> Data Management
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              {/* BACKUP */}
              <div style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: "rgba(168,85,247,0.1)", padding: 6, borderRadius: 8 }}><Download color="#a855f7" size={16} /></div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Encrypted Backup</div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 16 }}>
                  Backups are transparently encrypted by the system. Download requires email verification.
                </div>
                <button onClick={() => requestOtp("backup")} disabled={downloading} className="btn btn-primary w-full" style={{ width: "100%", justifyContent: "center" }}>
                  {downloading ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Download size={16} /> Download Backup</>}
                </button>
              </div>

              {/* RESTORE */}
              <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: "rgba(234,179,8,0.1)", padding: 6, borderRadius: 8 }}><Upload color="#eab308" size={16} /></div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Restore from Backup</div>
                </div>
                <label style={{ display: "block", padding: "10px", border: "1px dashed rgba(234,179,8,0.4)", borderRadius: 8, cursor: "pointer", textAlign: "center", fontSize: 12, color: "var(--text-secondary)", transition: "0.2s", marginBottom: 12, background: "rgba(255,255,255,0.02)" }} className="hover:bg-white/5">
                  {file ? file.name : "Click to select backup .zip file"}
                  <input type="file" accept=".zip" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                <button onClick={() => requestOtp("restore")} disabled={!file || uploading} style={{ width: "100%", background: !file || uploading ? "rgba(234,179,8,0.1)" : "#eab308", color: !file || uploading ? "var(--text-muted)" : "#000", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: !file || uploading ? "not-allowed" : "pointer", display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                  {uploading ? <><Loader2 size={16} className="spin" /> Restoring...</> : <><Upload size={16} /> Restore Backup</>}
                </button>
              </div>
            </div>
          </div>

          {/* 5. DANGER ZONE */}
          <div className="card" style={{ padding: 24, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.02)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "#ef4444" }}>
              <AlertTriangle size={16} color="#ef4444" /> Danger Zone
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Clear All Database Data</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Irreversible deletion of all platform records.</div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => requestOtp("clear_data")} disabled={clearing}
                style={{ gap: 6, flexShrink: 0, marginLeft: 12 }}
              >
                {clearing ? <><Loader2 size={13} className="spin" /> Clearing...</> : <><Trash2 size={13} /> Delete All</>}
              </button>
            </div>
          </div>

        </div>
      </div>

      {showOtpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div className="card" style={{ padding: 32, maxWidth: 400, width: "100%", animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "rgba(168,85,247,0.1)", padding: 8, borderRadius: 8, color: "var(--purple)" }}><ShieldCheck size={20} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Security Verification</h2>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.5 }}>
              To proceed with this administrative action, please enter the 6-digit OTP sent to your admin email.
            </p>
            <input 
              autoFocus 
              className="input" 
              placeholder="000000" 
              maxLength={6} 
              value={otpCode} 
              onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
              style={{ fontSize: 24, letterSpacing: "0.2em", textAlign: "center", fontWeight: 600, padding: "16px", marginBottom: 24, borderRadius: 12 }} 
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowOtpModal(false)} disabled={otpLoading || downloading || uploading || clearing}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOtpSubmit} disabled={otpLoading || otpCode.length !== 6 || downloading || uploading || clearing}>
                {otpLoading || downloading || uploading || clearing ? <Loader2 size={16} className="spin" /> : "Verify Action"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
