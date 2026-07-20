"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function AuthLayout({
  children,
  title,
  subtitle,
  variant = "admin",
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: "admin" | "employee";
}) {
  const isAdmin = variant === "admin";
  const secondary = isAdmin ? "#EC4899" : "#06B6D4";
  const orbA = isAdmin ? "168,85,247" : "99,102,241";
  const orbB = isAdmin ? "236,72,153" : "6,182,212";

  return (
    <>
      <style>{`
        .auth-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #040308;
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(${orbA}, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(${orbB}, 0.12) 0%, transparent 50%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          z-index: 9999; /* Overlays everything, guarantees no page scroll */
        }
        
        /* Ultra-subtle noise overlay for premium feel */
        .auth-bg::before {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }

        .auth-card {
          width: 100%; 
          max-width: 400px;
          max-height: 100%;
          background: linear-gradient(145deg, rgba(13,12,20,0.95) 0%, rgba(17,14,26,0.98) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: clamp(16px, 4vw, 22px);
          padding: clamp(24px, 6vw, 44px) clamp(20px, 6vw, 44px);
          border: 1px solid rgba(${orbA}, 0.2);
          box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative; 
          z-index: 10;
          overflow-y: auto;
          scrollbar-width: none; /* Hide scrollbar for sleekness */
        }
        .auth-card::-webkit-scrollbar {
          display: none;
        }
        
        .auth-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          -webkit-mask-image: radial-gradient(ellipse at center, black 10%, transparent 80%);
          mask-image: radial-gradient(ellipse at center, black 10%, transparent 80%);
          z-index: 1;
        }

        .auth-card-content {
          position: relative;
          z-index: 20;
        }
        .auth-card-glow {
          position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(${orbA}, 0.8), transparent);
          border-radius: 0 0 4px 4px;
          box-shadow: 0 1px 12px rgba(${orbA}, 0.6);
        }
        .auth-card-accent {
          position: absolute; top: -1px; right: 40px; width: 60px; height: 2px;
          background: ${secondary}; border-radius: 0 0 4px 4px; opacity: 0.8;
          box-shadow: 0 1px 8px ${secondary};
        }
        .auth-logo-wrapper { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .auth-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; border-radius: 6px; background: rgba(236,72,153,0.15); color: #F472B6; border: 1px solid rgba(236,72,153,0.3); }
        .auth-title { color:#FFF; font-size:clamp(20px,4vw,24px); font-weight:700; margin-bottom:8px; letter-spacing:-0.02em; line-height:1.2; }
        .auth-subtitle { color:#6B7280; font-size:14px; margin-bottom:24px; line-height:1.6; }

        /* Fix browser autofill styling for dark theme */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 50px #15121E inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
          caret-color: #FFFFFF !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="auth-bg">
        <div className="auth-card">
          <div className="auth-grid" />
          <div className="auth-card-glow" />
          <div className="auth-card-accent" />

          <div className="auth-card-content">
            <div className="auth-logo-wrapper">
              <img src="/logo.png" alt="CyberLabSec" style={{ height: 38, objectFit: "contain" }} />
              {isAdmin && (
                <div className="auth-badge">Admin</div>
              )}
            </div>

            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>

            <div className="auth-form">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
