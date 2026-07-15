"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no token is provided, we assume it's an authenticated user forced to reset their password
  }, [token]);

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/skip-reset", { method: "POST" });
      if (res.ok) router.push("/employee/dashboard");
      else setError("Failed to skip.");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setSuccess(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <CheckCircle size={40} color="var(--green)" style={{ margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>Password Reset Successful</h3>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Your password has been securely updated.</p>
        <div style={{ marginTop: 24 }}>
          <Link href="/employee/login" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div>
        <label className="label label-required">New Password</label>
        <div style={{ position: "relative" }}>
          <input className="input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ paddingRight: 40 }} required />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      
      <div>
        <label className="label label-required">Confirm Password</label>
        <input className="input" type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 13, color: "#fca5a5" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> <span>{error}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {!token && (
          <button className="btn btn-secondary" type="button" onClick={handleSkip} disabled={loading} style={{ flex: 1 }}>
            Skip for now
          </button>
        )}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Resetting...</> : "Reset Password"}
        </button>
      </div>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <motion.div className="card" style={{ maxWidth: 420, width: "100%", padding: 40, position: "relative", zIndex: 1 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, objectFit: "contain" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Set New Password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>Choose a strong password for your account.</p>

        <Suspense fallback={<div style={{ textAlign: "center", padding: "20px 0" }}><Loader2 size={24} className="spin" style={{ margin: "0 auto", color: "var(--purple)" }} /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
