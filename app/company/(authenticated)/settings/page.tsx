"use client";

import { useState } from "react";
import { Download, Upload, ShieldCheck, Database, Loader2, AlertTriangle, Trash2, Lock, Eye, EyeOff, Building, Linkedin } from "lucide-react";

export default function SettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password states
  const [backupPassword, setBackupPassword] = useState("CyberLabSec@2024");
  const [restorePassword, setRestorePassword] = useState("CyberLabSec@2024");
  const [showBkPwd, setShowBkPwd] = useState(false);
  const [showRsPwd, setShowRsPwd] = useState(false);

  // Company Profile states
  const [companyName, setCompanyName] = useState("CyberLabSec");
  const [companyDesc, setCompanyDesc] = useState("Advanced Offensive Security & Training Platform.");
  const [linkedinUrl, setLinkedinUrl] = useState("https://www.linkedin.com/company/cyberlabsec");

  const handleDownload = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/company/backup?password=${encodeURIComponent(backupPassword)}&encrypt=true`);
      if (!res.ok) { setMessage({ type: "error", text: "Download failed." }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cyberlabsec-${new Date().toISOString().split("T")[0]}.clsbackup`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "✅ Encrypted backup downloaded successfully (.clsbackup)." });
    } catch {
      setMessage({ type: "error", text: "Download error occurred." });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { setFile(e.target.files[0]); setMessage(null); }
  };

  const handleUpload = async () => {
    if (!file) return;
    const confirmed = window.prompt('WARNING: This will DELETE ALL current data and replace with backup.\n\nType "RESTORE" to confirm:');
    if (confirmed !== "RESTORE") { setMessage({ type: "error", text: "Cancelled — you must type RESTORE exactly." }); return; }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("backupFile", file);
    formData.append("password", restorePassword);

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

  const handleClearAll = async () => {
    const t1 = window.prompt('🚨 DANGER ZONE 🚨\nThis permanently deletes EVERYTHING.\n\nType "DELETE ALL" to confirm:');
    if (t1 !== "DELETE ALL") { setMessage({ type: "error", text: "Clear cancelled." }); return; }
    if (!window.confirm("FINAL WARNING: Are you 100% sure? This cannot be undone!")) return;

    setClearing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/company/clear-database", { method: "POST" });
      const data = await res.json();
      setMessage({ type: res.ok ? "success" : "error", text: (res.ok ? "✅ " : "❌ ") + (data.message || data.error) });
    } catch {
      setMessage({ type: "error", text: "❌ Error occurred." });
    } finally {
      setClearing(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
    borderRadius: 7, padding: "8px 12px", fontSize: 13, color: "var(--text-primary)",
    width: "100%", outline: "none", fontFamily: "monospace"
  };

  const pwdRowStyle = { display: "flex", gap: 6, alignItems: "center", marginBottom: 12 };

  return (
    <div style={{ maxWidth: 820 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .s-section { animation: fadeUp 0.35s ease-out both; }
        .s-section:nth-child(2){ animation-delay:0.08s; } .s-section:nth-child(3){ animation-delay:0.16s; } .s-section:nth-child(4){ animation-delay:0.24s; }
        .action-row { transition: box-shadow 0.2s, border-color 0.2s; }
        .action-row:hover { box-shadow: 0 0 0 1px rgba(168,85,247,0.25); }
        .danger-row:hover { box-shadow: 0 0 0 1px rgba(239,68,68,0.25) !important; }
        .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform:rotate(360deg); } }
        .pwd-toggle { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display:flex; align-items:center; }
        .pwd-toggle:hover { color: var(--text-primary); }
        input:focus { border-color: var(--purple) !important; box-shadow: 0 0 0 2px rgba(168,85,247,0.15); }
        label.file-label { cursor:pointer; padding: 7px 14px; background: rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:7px; font-size:12px; color:var(--text-secondary); display:flex; gap:6px; align-items:center; transition: border-color 0.2s; }
        label.file-label:hover { border-color: var(--purple); }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Platform Settings</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Manage CyberLabSec configuration, data safety & security.</p>
      </div>

      {message && (
        <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500, background: message.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", color: message.type === "success" ? "var(--green)" : "var(--red)", border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── COMPANY PROFILE ─────────────────────────────────────────── */}
        <div className="card s-section" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Building size={16} color="var(--purple)" /> Company Profile
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Description</label>
              <textarea rows={3} value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} style={{ ...inputStyle, fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>LinkedIn Profile URL</label>
              <div style={{ position: "relative" }}>
                <Linkedin size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input style={{ ...inputStyle, paddingLeft: 36 }} value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ justifySelf: "flex-end", padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "none", background: "var(--purple)", color: "white", cursor: "pointer" }}>Save Profile</button>
          </div>
        </div>

        {/* ── DOWNLOAD BACKUP ─────────────────────────────────────────── */}
        <div className="card s-section" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={16} color="var(--purple)" /> Full Encrypted Backup — Download
          </h2>

          <div className="action-row" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "rgba(168,85,247,0.05)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.12)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Download size={18} color="var(--purple)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Export Complete Database Backup</h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
                Downloads <strong>every record</strong> — Employees, Teams, CVs, Applications, Interview Sessions, Offer Letters, Tasks, Submissions, Attendance, Leave, Badges, Points, Messages, Appraisals, Tickets & more.
                The file is <strong>AES-256 encrypted</strong> (.clsbackup) — only someone with the correct password can restore it.
              </p>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <Lock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>Encryption Password:</span>
              </div>
              <div style={pwdRowStyle}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input type={showBkPwd ? "text" : "password"} value={backupPassword} onChange={e => setBackupPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 36 }} placeholder="Enter encryption password" />
                  <button className="pwd-toggle" onClick={() => setShowBkPwd(v => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                    {showBkPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button onClick={handleDownload} disabled={downloading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 18px", whiteSpace: "nowrap", opacity: downloading ? 0.7 : 1 }}>
                  {downloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                  {downloading ? "Generating..." : "Download Backup"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                💡 Save this password safely — you'll need it to restore this backup.
              </p>
            </div>
          </div>
        </div>

        {/* ── RESTORE BACKUP ──────────────────────────────────────────── */}
        <div className="card s-section" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Upload size={16} color="var(--amber)" /> Restore from Backup — Upload
          </h2>

          <div className="action-row" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "rgba(234,179,8,0.05)", borderRadius: 10, border: "1px solid rgba(234,179,8,0.12)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(234,179,8,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Upload size={18} color="var(--amber)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Restore Full Platform Data</h3>
              <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.07)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)", marginBottom: 14, fontSize: 11, color: "var(--red)", display: "flex", gap: 6 }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Warning:</strong> Current database will be completely wiped before restoring. Accepts .clsbackup (encrypted) or .json (plain).</span>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <Lock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Decryption Password:</span>
              </div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input type={showRsPwd ? "text" : "password"} value={restorePassword} onChange={e => setRestorePassword(e.target.value)} style={{ ...inputStyle, paddingRight: 36 }} placeholder="Enter decryption password" />
                <button className="pwd-toggle" onClick={() => setShowRsPwd(v => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                  {showRsPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label className="file-label">
                  <Upload size={12} />
                  {file ? file.name : "Choose .clsbackup or .json"}
                  <input type="file" accept=".clsbackup,.json" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                <button onClick={handleUpload} disabled={!file || uploading} style={{ background: !file || uploading ? "rgba(234,179,8,0.1)" : "var(--amber)", color: !file || uploading ? "var(--text-muted)" : "#000", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: !file || uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                  {uploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                  {uploading ? "Restoring..." : "Restore Now"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SYSTEM STATUS ───────────────────────────────────────────── */}
        <div className="card s-section" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} color="var(--green)" /> System Status
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { label: "Database Connection", val: "Online", color: "var(--green)" },
              { label: "Encryption", val: "AES-256-CBC Active", color: "var(--blue)" },
              { label: "Backup Format", val: ".clsbackup (Encrypted)", color: "var(--purple)" },
              { label: "Platform Version", val: "v3.0.0 (CyberLabSec)", color: "var(--text-primary)" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color }}>
                  {color === "var(--green)" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />}
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DANGER ZONE ─────────────────────────────────────────────── */}
        <div className="card s-section" style={{ padding: 24, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.02)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8, color: "var(--red)" }}>
            <AlertTriangle size={16} /> Danger Zone
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
            These actions are <strong>irreversible</strong>. Download a backup before proceeding.
          </p>

          <div className="action-row danger-row" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "rgba(239,68,68,0.05)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={18} color="var(--red)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: "var(--red)" }}>Clear All Database</h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
                Permanently deletes <strong>every record</strong> — Employees, Applicants, Tasks, Announcements, everything. Platform becomes completely empty.
              </p>
              <button onClick={handleClearAll} disabled={clearing} style={{ background: clearing ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.12)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: clearing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                {clearing ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                {clearing ? "Clearing..." : "Clear All Database"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
