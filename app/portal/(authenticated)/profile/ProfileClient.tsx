"use client";

import { useState } from "react";
import { format } from "date-fns";
import { User, Shield, Calendar, KeyRound, Eye, EyeOff, Loader2, CheckCircle, Clock, Activity } from "lucide-react";

interface Employee {
  id: string; name: string; email: string; designation: string;
  employeeCode: string; employmentType: string; photoUrl: string | null;
  startDate: string; endDate: string | null; status: string;
  teamId: string | null; policyAcknowledgedAt: string | null;
  githubUrl: string | null; linkedinUrl: string | null;
  team: { name: string } | null;
}

interface ActivityLog {
  id: string; action: string; metadata: string; timestamp: string;
}

export default function ProfileClient({ employee, activityLogs }: { employee: Employee; activityLogs: ActivityLog[] }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [githubUrl, setGithubUrl] = useState(employee.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(employee.linkedinUrl || "");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMsg, setSocialMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialLoading(true); setSocialMsg(null);
    const res = await fetch("/api/portal/profile/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubUrl, linkedinUrl }),
    });
    const data = await res.json();
    setSocialLoading(false);
    if (!res.ok) { setSocialMsg({ type: "err", text: data.error || "Failed to save." }); return; }
    setSocialMsg({ type: "ok", text: "Social links saved successfully." });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "New passwords do not match." }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "err", text: "Password must be at least 8 characters." }); return; }
    setLoading(true); setPwMsg(null);
    const res = await fetch("/api/portal/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setPwMsg({ type: "err", text: data.error || "Failed to update password." }); return; }
    setPwMsg({ type: "ok", text: "Password updated successfully." });
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: "Signed in", LOGOUT: "Signed out", TASK_SUBMIT: "Submitted task", PASSWORD_CHANGE: "Changed password",
    };
    return map[action] || action;
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>My Profile</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Manage your account and security settings</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Employee Info */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={15} color="var(--purple)" /> Employee Details
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(168,85,247,0.15)", border: "2px solid rgba(168,85,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "var(--purple)", flexShrink: 0 }}>
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{employee.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{employee.designation}</div>
            </div>
          </div>

          {[
            { icon: <Shield size={14} />, label: "Employee ID", value: employee.employeeCode },
            { icon: <User size={14} />, label: "Email", value: employee.email },
            { icon: <Activity size={14} />, label: "Type", value: employee.employmentType },
            { icon: <Calendar size={14} />, label: "Start Date", value: format(new Date(employee.startDate), "MMMM d, yyyy") },
            ...(employee.endDate ? [{ icon: <Calendar size={14} />, label: "End Date", value: format(new Date(employee.endDate), "MMMM d, yyyy") }] : []),
            { icon: <User size={14} />, label: "Team", value: employee.team?.name || "Unassigned" },
            {
              icon: <CheckCircle size={14} />,
              label: "Policy",
              value: employee.policyAcknowledgedAt ? `Acknowledged ${format(new Date(employee.policyAcknowledgedAt), "MMM d, yyyy")}` : "Not yet acknowledged",
            },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)", marginTop: 1, flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 1 }}>{r.label}</div>
                <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{r.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={15} color="var(--blue)" /> Social Profiles
          </h2>
          <form onSubmit={handleSaveSocial} style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="label">GitHub Profile URL</label>
              <input className="input" placeholder="https://github.com/username" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
            </div>
            <div>
              <label className="label">LinkedIn Profile URL</label>
              <input className="input" placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
            </div>
            {socialMsg && (
              <div style={{ fontSize: 13, padding: "10px 14px", borderRadius: 8, background: socialMsg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(168,85,247,0.08)", border: `1px solid ${socialMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)"}`, color: socialMsg.type === "ok" ? "var(--green)" : "#fca5a5" }}>
                {socialMsg.text}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={socialLoading}>
              {socialLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : "Save Social Links"}
            </button>
          </form>
        </div>

        <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
          {/* Change Password */}
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <KeyRound size={15} color="var(--amber)" /> Change Password
            </h2>
            <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 14 }}>
              {[
                { label: "Current Password", val: currentPw, setter: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
                { label: "New Password", val: newPw, setter: setNewPw, show: showNew, toggle: () => setShowNew(p => !p) },
                { label: "Confirm New Password", val: confirmPw, setter: setConfirmPw, show: showNew, toggle: () => {} },
              ].map((f, i) => (
                <div key={i}>
                  <label className="label label-required">{f.label}</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={f.show ? "text" : "password"} value={f.val} onChange={e => f.setter(e.target.value)} style={{ paddingRight: 40 }} required />
                    {i < 2 && (
                      <button type="button" onClick={f.toggle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                        {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {pwMsg && (
                <div style={{ fontSize: 13, padding: "10px 14px", borderRadius: 8, background: pwMsg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(168,85,247,0.08)", border: `1px solid ${pwMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)"}`, color: pwMsg.type === "ok" ? "var(--green)" : "#fca5a5" }}>
                  {pwMsg.text}
                </div>
              )}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Updating...</> : "Update Password"}
              </button>
            </form>
          </div>

          {/* Activity Log */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={15} color="var(--blue)" /> Recent Activity
            </h2>
            {activityLogs.filter(l => l.action !== "LOGIN").length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No other activity recorded yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {activityLogs.filter(l => l.action !== "LOGIN").slice(0, 5).map(log => (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{getActionLabel(log.action)}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{format(new Date(log.timestamp), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Login History */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={15} color="var(--green)" /> Login History
            </h2>
            {activityLogs.filter(l => l.action === "LOGIN").length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No login history found.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {activityLogs.filter(l => l.action === "LOGIN").map(log => {
                  let ip = "Unknown IP";
                  try {
                    ip = JSON.parse(log.metadata).ip || ip;
                  } catch (e) {}
                  return (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>Successful Login</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>IP: {ip}</div>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
