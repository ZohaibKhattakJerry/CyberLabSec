"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, AlertCircle, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setError("New passwords do not match."); return; }
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/employee/portal/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to update password."); return; }
    router.push("/employee/dashboard");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <motion.div className="card" style={{ maxWidth: 440, width: "100%", padding: 40 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, objectFit: "contain" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <KeyRound size={20} color="var(--amber)" />
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Set New Password</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>
          Your account requires a password change before you can continue.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="label label-required">Temporary / Current Password</label>
            <div style={{ position: "relative" }}>
              <input className="input" type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowCurrent(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label label-required">New Password</label>
            <div style={{ position: "relative" }}>
              <input className="input" type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowNew(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label label-required">Confirm New Password</label>
            <input className="input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 13, color: "#fca5a5" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Updating...</> : "Set New Password & Continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
