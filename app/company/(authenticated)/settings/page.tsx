"use client";

import { useState } from "react";
import { Download, Upload, ShieldCheck, Database, Loader2, AlertTriangle, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const confirmed = window.prompt(
      'WARNING: This will DELETE ALL current data and replace it with the backup.\n\nType "RESTORE" to confirm:'
    );
    if (confirmed !== "RESTORE") {
      setMessage({ type: "error", text: "Restoration cancelled. You must type RESTORE exactly." });
      return;
    }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("backupFile", file);

    try {
      const res = await fetch("/api/company/restore", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "✅ " + (data.message || "Database restored successfully!") });
        setFile(null);
      } else {
        setMessage({ type: "error", text: "❌ " + (data.error || "Failed to restore database.") });
      }
    } catch {
      setMessage({ type: "error", text: "❌ An error occurred during restoration." });
    } finally {
      setUploading(false);
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.prompt(
      '🚨 DANGER ZONE 🚨\nThis will PERMANENTLY DELETE every record in the database.\n\nType "DELETE ALL" to confirm:'
    );
    if (confirmed !== "DELETE ALL") {
      setMessage({ type: "error", text: "Clear cancelled. You must type DELETE ALL exactly." });
      return;
    }
    const doubleConfirm = window.confirm("FINAL WARNING: Are you 100% sure? This cannot be undone!");
    if (!doubleConfirm) return;

    setClearing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/company/clear-database", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "✅ " + (data.message || "Database cleared successfully.") });
      } else {
        setMessage({ type: "error", text: "❌ " + (data.error || "Failed to clear database.") });
      }
    } catch {
      setMessage({ type: "error", text: "❌ An error occurred." });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .settings-section { animation: fadeUp 0.35s ease-out both; }
        .settings-section:nth-child(2) { animation-delay: 0.1s; }
        .settings-section:nth-child(3) { animation-delay: 0.2s; }
        .action-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .action-card:hover { box-shadow: 0 0 0 1px rgba(168,85,247,0.3); }
        .danger-card:hover { box-shadow: 0 0 0 1px rgba(239,68,68,0.3) !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Platform Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Manage your CyberLabSec platform configuration and data safety.
        </p>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: message.type === "success" ? "var(--green)" : "var(--red)",
          border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertTriangle size={15} />
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Data Management */}
        <div className="card settings-section" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={17} color="var(--purple)" /> Data Management
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Download Backup */}
            <div className="action-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "rgba(168,85,247,0.05)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.12)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Download size={18} color="var(--purple)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Export Full Backup (Download)</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
                  Download a complete JSON backup of ALL data — Employees, Teams, Tasks, Applicants, Announcements, Documents, Interview Sessions, Offer Letters & more.
                </p>
                <a href="/api/company/backup" className="btn btn-primary" style={{ display: "inline-flex", gap: 6, fontSize: 12, padding: "7px 16px" }} target="_blank">
                  <Download size={13} /> Download Full Backup
                </a>
              </div>
            </div>

            {/* Upload & Restore */}
            <div className="action-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "rgba(234,179,8,0.05)", borderRadius: 10, border: "1px solid rgba(234,179,8,0.12)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(234,179,8,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Upload size={18} color="var(--amber)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Restore from Backup (Upload)</h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.6 }}>
                  Upload a backup JSON file to fully restore platform data.
                </p>
                <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)", marginBottom: 12, fontSize: 11, color: "var(--red)", display: "flex", gap: 6 }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>Warning:</strong> This will WIPE the current database completely before restoring from the file. Make sure your backup is valid.</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ cursor: "pointer", padding: "7px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 7, fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 6, alignItems: "center" }}>
                    <Upload size={12} />
                    {file ? file.name : "Choose .json file"}
                    <input type="file" accept=".json" onChange={handleFileChange} style={{ display: "none" }} />
                  </label>
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    style={{
                      background: !file || uploading ? "rgba(255,255,255,0.05)" : "var(--amber)",
                      color: !file || uploading ? "var(--text-muted)" : "#000",
                      border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 700,
                      cursor: !file || uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                    }}
                  >
                    {uploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                    {uploading ? "Restoring..." : "Restore Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="card settings-section" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={17} color="var(--green)" /> System Status
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { label: "Database Connection", status: "Online", color: "var(--green)" },
              { label: "Core Services", status: "Operational", color: "var(--green)" },
              { label: "Platform Version", status: "v2.1.0 (CyberLabSec)", color: "var(--text-primary)" },
            ].map(({ label, status, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color }}>
                  {color === "var(--green)" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />}
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="card settings-section" style={{ padding: 24, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.03)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8, color: "var(--red)" }}>
            <AlertTriangle size={17} /> Danger Zone
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.6 }}>
            These actions are irreversible. Proceed with extreme caution. Make sure you have downloaded a full backup before proceeding.
          </p>

          <div className="action-card danger-card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "rgba(239,68,68,0.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={18} color="var(--red)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: "var(--red)" }}>Clear All Database</h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
                Permanently delete <strong>every record</strong> from the database — Employees, Teams, Applicants, Tasks, Announcements, everything. The platform will be completely empty afterward.
              </p>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                style={{
                  background: clearing ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.15)",
                  color: "var(--red)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 700,
                  cursor: clearing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                }}
              >
                {clearing ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                {clearing ? "Clearing Database..." : "Clear All Database"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
