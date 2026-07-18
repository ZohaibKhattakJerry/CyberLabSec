"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      let data;
      try { data = await res.json(); } catch (e) { data = null; }
      
      if (!res.ok) { 
        setError(data?.error || `Server Error (${res.status})`); 
        return; 
      }
      router.push("/company/dashboard");
      router.refresh();
    } catch { setError("Connection failed. Please check your internet."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div className="card" style={{ maxWidth: 420, width: "100%", padding: 40 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, objectFit: "contain" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Admin Login</h1>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="label label-required">Admin ID</label>
            <input className="input" type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} required />
          </div>
          <div>
            <label className="label label-required">Admin Password</label>
            <div style={{ position: "relative" }}>
              <input className="input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 13, color: "#fca5a5" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Access Console"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
