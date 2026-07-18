import { Download, ShieldCheck, Database, RefreshCw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
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
          
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px", background: "rgba(168,85,247,0.05)", borderRadius: 8, border: "1px solid rgba(168,85,247,0.1)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Download size={20} color="var(--purple)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>Export Platform Data (Backup)</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                Download a complete JSON backup of your database including all employees, teams, job postings, applicants, and announcements. Use this to prevent data loss or for local analysis.
              </p>
              <Link 
                href="/api/company/backup"
                className="btn btn-primary"
                style={{ display: "inline-flex", gap: 6, fontSize: 13 }}
                target="_blank"
              >
                <Download size={14} /> Download Backup
              </Link>
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
            
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Platform Version</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                v2.0.1 (CyberLabSec)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
