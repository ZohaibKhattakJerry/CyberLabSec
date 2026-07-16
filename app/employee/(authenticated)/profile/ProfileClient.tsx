"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { User, Shield, Calendar, KeyRound, Eye, EyeOff, Loader2, Activity, Camera, Code, Link as LinkIcon, UploadCloud, Award } from "lucide-react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string; name: string; email: string; designation: string;
  employeeCode: string; employmentType: string; photoUrl: string | null;
  startDate: string; endDate: string | null; status: string;
  teamId: string | null; policyAcknowledgedAt: string | null;
  githubUrl: string | null; linkedinUrl: string | null;
  team: { name: string } | null;
  badges?: { id: string; type: string; label: string; awardedAt: string }[];
}

interface ActivityLog {
  id: string; action: string; metadata: string; timestamp: string;
}

export default function ProfileClient({ employee, activityLogs }: { employee: Employee; activityLogs: ActivityLog[] }) {
  const router = useRouter();
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

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be less than 2MB");
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/employee/profile/photo", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Failed to upload photo");
      router.refresh();
    } catch (err: unknown) {
      alert(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialLoading(true); setSocialMsg(null);
    const res = await fetch("/api/employee/profile/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubUrl, linkedinUrl }),
    });
    const data = await res.json();
    setSocialLoading(false);
    if (!res.ok) { setSocialMsg({ type: "err", text: data.error || "Failed to save." }); return; }
    setSocialMsg({ type: "ok", text: "Social links saved successfully." });
    router.refresh();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "New passwords do not match." }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "err", text: "Password must be at least 8 characters." }); return; }
    setLoading(true); setPwMsg(null);
    const res = await fetch("/api/employee/profile/password", {
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
      LOGIN: "System access granted", LOGOUT: "System disconnect", TASK_SUBMIT: "Objective submitted", PASSWORD_CHANGE: "Credentials rotated",
    };
    return map[action] || action;
  };

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Employee Profile</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Manage identity, credentials, and access logs.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, alignItems: "start" }}>
        
        {/* Left Column */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Identity Card */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 100, background: "linear-gradient(to right, rgba(168,85,247,0.2), rgba(59,130,246,0.2))", position: "relative" }}>
              <div style={{ position: "absolute", bottom: -40, left: 24, display: "flex", alignItems: "flex-end", gap: 16 }}>
                <div 
                  style={{ width: 90, height: 90, borderRadius: 16, background: "var(--bg-card)", border: "4px solid var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "var(--purple)", position: "relative", overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {employee.photoUrl ? (
                    <img src={employee.photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    employee.name.charAt(0).toUpperCase()
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} className="hover:opacity-100">
                    {uploadingPhoto ? <Loader2 size={24} color="#fff" style={{ animation: "spin 1s linear infinite" }} /> : <Camera size={24} color="#fff" />}
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handlePhotoUpload} />
                </div>
              </div>
            </div>
            
            <div style={{ padding: "50px 24px 24px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{employee.name}</div>
                  <div style={{ fontSize: 14, color: "var(--purple)", fontWeight: 600, marginTop: 4 }}>{employee.designation}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="badge badge-gray" style={{ marginBottom: 6 }}>{employee.status}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ID: {employee.employeeCode}</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                {[
                  { icon: <User size={14} />, label: "Comm Link", value: employee.email },
                  { icon: <Shield size={14} />, label: "Squad Assignment", value: employee.team?.name || "Pending Assignment" },
                  { icon: <Activity size={14} />, label: "Clearance Level", value: employee.employmentType },
                  { icon: <Calendar size={14} />, label: "Induction Date", value: format(new Date(employee.startDate), "MMM d, yyyy") },
                ].map((r: unknown) => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
                      {r.icon}
                    </div>
                    <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.label}</span>
                      <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{r.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Profiles */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <User size={16} color="var(--blue)" /> External Databanks
            </h2>
            <form onSubmit={handleSaveSocial} style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Code size={14} /> GitHub Repository</label>
                <input className="input" placeholder="https://github.com/username" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} style={{ borderRadius: 8 }} />
              </div>
              <div>
                <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={14} /> Professional Network</label>
                <input className="input" placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} style={{ borderRadius: 8 }} />
              </div>
              {socialMsg && (
                <div style={{ fontSize: 13, padding: "12px 16px", borderRadius: 8, background: socialMsg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(168,85,247,0.08)", border: `1px solid ${socialMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)"}`, color: socialMsg.type === "ok" ? "var(--green)" : "#fca5a5" }}>
                  {socialMsg.text}
                </div>
              )}
              <button className="btn btn-primary" type="submit" disabled={socialLoading} style={{ marginTop: 4, height: 40 }}>
                {socialLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Syncing...</> : <><UploadCloud size={16} /> Sync Profiles</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          
          {/* Change Password */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <KeyRound size={16} color="var(--amber)" /> Credential Rotation
            </h2>
            <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 16 }}>
              {[
                { label: "Current Passcode", val: currentPw, setter: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
                { label: "New Passcode", val: newPw, setter: setNewPw, show: showNew, toggle: () => setShowNew(p => !p) },
                { label: "Verify New Passcode", val: confirmPw, setter: setConfirmPw, show: showNew, toggle: () => {} },
              ].map((f, i) => (
                <div key={i}>
                  <label className="label label-required">{f.label}</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={f.show ? "text" : "password"} value={f.val} onChange={e => f.setter(e.target.value)} style={{ paddingRight: 40, borderRadius: 8 }} required minLength={8} />
                    {i < 2 && (
                      <button type="button" onClick={f.toggle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                        {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {pwMsg && (
                <div style={{ fontSize: 13, padding: "12px 16px", borderRadius: 8, background: pwMsg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(168,85,247,0.08)", border: `1px solid ${pwMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)"}`, color: pwMsg.type === "ok" ? "var(--green)" : "#fca5a5" }}>
                  {pwMsg.text}
                </div>
              )}
              <button className="btn" type="submit" disabled={loading} style={{ marginTop: 4, height: 40, background: "rgba(245, 158, 11, 0.1)", color: "var(--amber)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating Hash...</> : "Rotate Credentials"}
              </button>
            </form>
          </div>

          {/* Access Logs */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
              <Shield size={16} color="var(--green)" /> Security & Access Logs
            </h2>
            <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
              {activityLogs.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>No logs recorded in the mainframe.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {activityLogs.map((log: unknown) => {
                    let ip = "Unknown IP";
                    try { ip = JSON.parse(log.metadata).ip || ip; } catch {}
                    
                    const isLogin = log.action === "LOGIN";
                    const isLogout = log.action === "LOGOUT";
                    
                    return (
                      <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: isLogin ? "rgba(34,197,94,0.1)" : isLogout ? "rgba(239,68,68,0.1)" : "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: isLogin ? "var(--green)" : isLogout ? "var(--red)" : "var(--purple)", flexShrink: 0 }}>
                          {isLogin || isLogout ? <KeyRound size={14} /> : <Activity size={14} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                            <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>{getActionLabel(log.action)}</div>
                            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{format(new Date(log.timestamp), "MMM d, h:mm a")}</span>
                          </div>
                          {isLogin && <div style={{ color: "var(--text-muted)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} /> Origin: {ip}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Verification Badges */}
          {employee.badges && employee.badges.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                <Award size={16} color="var(--amber)" /> Verification Badges
              </h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {employee.badges.map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8 }}>
                    <Award size={16} color="var(--amber)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)" }}>{b.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{format(new Date(b.awardedAt), "MMM d, yyyy")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Security */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <KeyRound size={16} color="var(--purple)" /> Account Security
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Sign Out of All Devices</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Invalidate all active sessions across every device</div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                style={{ gap: 6 }}
                onClick={async () => {
                  if (!confirm("Sign out of all devices? You will be logged out immediately.")) return;
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/employee/login");
                }}
              >
                <Shield size={13} /> Sign Out All
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
