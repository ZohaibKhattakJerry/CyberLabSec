"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

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
    <AuthLayout title="Forgot Password" subtitle="Enter your email address to receive a password reset link." variant="employee">
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
    </AuthLayout>
  );
}
