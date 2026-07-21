"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, User, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password }),
      });
      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        setError(data?.error || `Authentication failed (${res.status})`);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.replace("/company/dashboard");
      }, 600);
    } catch {
      setError("Connection failed. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => ({
    width: "100%",
    background: focusedField === field ? "rgba(168,85,247,0.06)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${focusedField === field ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 12,
    padding: "13px 44px 13px 44px",
    color: "#FFFFFF",
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(168,85,247,0.1)" : "none",
  });

  return (
    <AuthLayout
      title="Company Portal"
      subtitle="Secure administrative access to CyberLabSec infrastructure."
      variant="admin"
    >
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
        <div>
          <label htmlFor="admin-id" style={{ display: "block", color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Admin ID
          </label>
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focusedField === "id" ? "#A855F7" : "#4B5563", transition: "color 0.2s" }} />
            <input
              id="admin-id"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              onFocus={() => setFocusedField("id")}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="username"
              placeholder="Enter Admin ID"
              style={inputStyle("id")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" style={{ display: "block", color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focusedField === "pw" ? "#A855F7" : "#4B5563", transition: "color 0.2s" }} />
            <input
              id="admin-password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("pw")}
              onBlur={() => setFocusedField(null)}
              required
              autoComplete="current-password"
              placeholder="Enter password"
              style={{ ...inputStyle("pw"), paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4B5563", display: "flex", padding: 4, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A855F7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
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
          <motion.button
            type="submit"
            disabled={loading || success}
            whileHover={!loading && !success ? { y: -1, boxShadow: "0 6px 24px rgba(168,85,247,0.4)" } : {}}
            whileTap={!loading && !success ? { scale: 0.98 } : {}}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: success
                ? "linear-gradient(135deg, #22C55E, #16A34A)"
                : "linear-gradient(135deg, #A855F7, #7C3AED)",
              border: "none",
              borderRadius: 12,
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || success ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              letterSpacing: "-0.01em",
              transition: "background 0.3s ease, opacity 0.3s ease",
              opacity: loading ? 0.7 : 1,
              boxShadow: success
                ? "0 4px 20px rgba(34,197,94,0.3)"
                : "0 4px 20px rgba(168,85,247,0.3)",
              fontFamily: "inherit",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" />
                Authenticating...
              </>
            ) : success ? (
              <>✓ Access Granted — Redirecting</>
            ) : (
              <>
                Access Console
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#374151", fontSize: 12, marginTop: 4 }}>
          <ShieldCheck size={13} style={{ color: "#A855F7" }} />
          <span>Protected by enterprise-grade encryption</span>
        </div>
      </form>
    </AuthLayout>
  );
}
