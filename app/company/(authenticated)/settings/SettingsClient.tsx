"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Shield, Settings2, Bell, Lock } from "lucide-react";
import toast from "react-hot-toast";

interface SettingsData {
  companyName: string;
  defaultPassMark: number;
  timezone: string;
}

export default function SettingsClient() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/company/settings")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={32} className="text-purple-500 animate-spin" style={{ color: "var(--purple)" }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <Settings2 size={20} color="var(--purple)" />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>General Settings</h2>
        </div>
        
        <div style={{ display: "grid", gap: 20, maxWidth: 600 }}>
          <div>
            <label className="label">Company Name</label>
            <input 
              className="input" 
              value={data.companyName || ""} 
              onChange={e => setData({ ...data, companyName: e.target.value })} 
            />
          </div>
          <div>
            <label className="label">Default Assessment Pass Mark (%)</label>
            <input 
              className="input" 
              type="number" 
              value={data.defaultPassMark || 60} 
              onChange={e => setData({ ...data, defaultPassMark: parseInt(e.target.value) || 0 })} 
            />
          </div>
          <div>
            <label className="label">Timezone</label>
            <select 
              className="input" 
              value={data.timezone || "UTC"} 
              onChange={e => setData({ ...data, timezone: e.target.value })}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Karachi">Karachi (PKT)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <Shield size={20} color="var(--amber)" />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Security Configuration</h2>
        </div>
        
        <div style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" defaultChecked /> Require 2FA for all Admin actions
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" defaultChecked /> Enforce strict password policies for employee accounts
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" /> Restrict Admin portal access to authorized IPs only
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={saving}
          style={{ gap: 8, padding: "10px 24px" }}
        >
          {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
