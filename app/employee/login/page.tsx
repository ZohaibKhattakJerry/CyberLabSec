"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, User, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";

export default function PortalLogin() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        setError(data?.error || `Authentication failed (${res.status})`);
        return;
      }
      setSuccess(true);
      const dest = data?.mustResetPassword ? "/employee/reset-password" : "/employee/dashboard";
      setTimeout(() => {
        window.location.replace(dest);
      }, 600);
    } catch {
      setError("Connection failed. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Employee Portal"
      subtitle="Access your CyberLabSec workspace securely."
      variant="employee"
    >
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
        <div>
          <label htmlFor="employee-code" style={{ display: "block", color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Employee ID
          </label>
          <div className="auth-input-wrapper">
            <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4B5563", pointerEvents: "none", zIndex: 1 }} />
            <input
              id="employee-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="username"
              placeholder="e.g. CL-2025-001"
              className="auth-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="employee-password" style={{ display: "block", color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Password
          </label>
          <div className="auth-input-wrapper">
            <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4B5563", pointerEvents: "none", zIndex: 1 }} />
            <input
              id="employee-password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
              className="auth-input"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="auth-icon-btn"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
              role="alert"
              aria-live="polite"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 13, color: "#FCA5A5" }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 4 }}>
          <button
            type="submit"
            disabled={loading || success}
            className={`auth-submit-btn${success ? " success" : ""}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinner-anim" />
                Authenticating...
              </>
            ) : success ? (
              <>✓ Access Granted — Redirecting</>
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Link href="/employee/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
          <Link href="mailto:support@cyberlabsec.tech" className="auth-link-muted">
            Contact IT Support
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#374151", fontSize: 12 }}>
          <ShieldCheck size={13} style={{ color: "#6366F1" }} />
          <span>Protected by enterprise-grade encryption</span>
        </div>
      </form>
    </AuthLayout>
  );
}
