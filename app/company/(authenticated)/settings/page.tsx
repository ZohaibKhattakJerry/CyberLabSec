"use client";

import { useState } from "react";
import { Download, Upload, ShieldCheck, Database, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!confirm("WARNING: This will overwrite existing records with the uploaded data. Are you absolutely sure you want to proceed?")) {
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("backupFile", file);

    try {
      const res = await fetch("/api/company/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || "Database restored successfully!" });
        setFile(null); // clear file input
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to restore database." });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "An error occurred during restoration." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Platform Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Manage your CyberLabSec platform configuration and data.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Data Management Section */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={18} color="var(--purple)" /> Data Management
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Download Backup */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px", background: "rgba(168,85,247,0.05)", borderRadius: 8, border: "1px solid rgba(168,85,247,0.1)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Download size={20} color="var(--purple)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>Export Platform Data (Backup)</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                  Download a complete JSON backup of your database including all employees, teams, job postings, applicants, and announcements. Use this to prevent data loss.
                </p>
                <a 
                  href="/api/company/backup"
                  className="btn btn-primary"
                  style={{ display: "inline-flex", gap: 6, fontSize: 13 }}
                  target="_blank"
                >
                  <Download size={14} /> Download Backup
                </a>
              </div>
            </div>

            {/* Upload Backup */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px", background: "rgba(234,179,8,0.05)", borderRadius: 8, border: "1px solid rgba(234,179,8,0.1)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(234,179,8,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Upload size={20} color="var(--amber)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>Restore Platform Data (Upload)</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                  Upload a previously downloaded JSON backup file to restore or migrate data. <strong>Warning:</strong> This will overwrite existing records with the same IDs.
                </p>
                
                {message && (
                  <div style={{ 
                    padding: 12, 
                    borderRadius: 6, 
                    marginBottom: 12, 
                    fontSize: 13,
                    background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {message.type === 'error' && <AlertTriangle size={16} />}
                    {message.text}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleFileChange}
                    style={{ fontSize: 13, color: "var(--text-secondary)" }}
                  />
                  <button 
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn"
                    style={{ 
                      background: !file || uploading ? 'rgba(255,255,255,0.05)' : 'var(--amber)',
                      color: !file || uploading ? 'var(--text-muted)' : '#000',
                      display: "inline-flex", 
                      alignItems: "center",
                      gap: 6, 
                      fontSize: 13,
                      border: "none",
                      fontWeight: 600,
                      cursor: !file || uploading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} 
                    {uploading ? "Restoring Data..." : "Restore Backup"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Section */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="var(--green)" /> System Status
          </h2>
          
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Database Connection</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--green)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 10px var(--green)" }} />
                Online
              </span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Core Services</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--green)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 10px var(--green)" }} />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
