"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Request failed"); return; }
      setSuccess(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <motion.div className="card" style={{ maxWidth: 420, width: "100%", padding: 40, position: "relative", zIndex: 1 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, objectFit: "contain" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Forgot Password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>Enter your email address to receive a password reset link.</p>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={40} color="var(--green)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>Reset Link Sent</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>If an account exists for {email}, a reset link has been sent to it.</p>
            <div style={{ marginTop: 24 }}>
              <Link href="/employee/login" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>Return to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label className="label label-required">Email Address</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. employee@cyberlabsec.tech" required />
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 13, color: "#fca5a5" }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</> : "Send Reset Link"}
            </button>
          </form>
        )}

        {!success && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link href="/employee/login" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>← Back to Login</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
