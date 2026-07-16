"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function PortalLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeCode: code.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push(data.mustResetPassword ? "/employee/reset-password" : "/employee/dashboard");
      router.refresh();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in with your employee credentials">
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
        <div>
          <label className="label label-required">Employee ID</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CL-2025-001" autoComplete="username" required />
        </div>
        <div>
          <label className="label label-required">Password</label>
          <div style={{ position: "relative" }}>
            <input className="input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" style={{ paddingRight: 40 }} required />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 13, color: "#fca5a5" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        <Link href="/employee/forgot-password" style={{ color: "var(--purple)", textDecoration: "none" }}>Forgot your password?</Link>
      </div>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <Link href="/careers" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>← View open positions</Link>
      </div>
    </AuthLayout>
  );
}
