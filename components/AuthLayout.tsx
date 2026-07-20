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
  const primary = isAdmin ? "#A855F7" : "#6366F1";
  const secondary = isAdmin ? "#EC4899" : "#06B6D4";
  const orbA = isAdmin ? "168,85,247" : "99,102,241";
  const orbB = isAdmin ? "236,72,153" : "6,182,212";

  return (
    <>
      <style>{`
        @keyframes drift-a {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.3; }
          33% { transform: translate3d(30px, -50px, 0) rotate(10deg); opacity: 0.4; }
          66% { transform: translate3d(-20px, 20px, 0) rotate(-5deg); opacity: 0.25; }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.3; }
        }
        @keyframes drift-b {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.25; }
          33% { transform: translate3d(-40px, 30px, 0) rotate(-10deg); opacity: 0.35; }
          66% { transform: translate3d(20px, -20px, 0) rotate(5deg); opacity: 0.2; }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.25; }
        }
        @keyframes card-in {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes field-in {
          from { opacity: 0; transform: translate3d(-10px, 0, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        .auth-bg {
          min-height: 100vh;
          width: 100vw;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          perspective: 1000px;
        }

        .auth-orb {
          border-radius: 50%;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          filter: blur(80px);
          transform: translateZ(0);
          mix-blend-mode: screen;
        }
        
        .bg-orb-a {
          position: absolute;
          width: 900px; height: 900px;
          top: -20%; left: -20%;
          background: rgba(${orbA}, 0.25);
          animation: drift-a 25s ease-in-out infinite;
          z-index: 0;
        }
        .bg-orb-b {
          position: absolute;
          width: 800px; height: 800px;
          bottom: -20%; right: -20%;
          background: rgba(${orbB}, 0.2);
          animation: drift-b 30s ease-in-out infinite 2s;
          z-index: 0;
        }
        
        .auth-card {
          width: 100%; max-width: 420px;
          background: rgba(10, 10, 12, 0.6);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border-radius: clamp(16px, 4vw, 24px);
          padding: clamp(32px, 6vw, 48px) clamp(24px, 6vw, 40px);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
          position: relative; z-index: 10;
          overflow: hidden;
          animation: card-in 0.5s cubic-bezier(0.2,0.8,0.2,1) both;
          transform: translateZ(0); /* Separate layer */
        }
        
        .auth-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
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
        
        .auth-logo-wrapper { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; animation: field-in 0.6s cubic-bezier(0.2,0.8,0.2,1) 0.1s both; }
        .auth-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); color: #E5E7EB; border: 1px solid rgba(255,255,255,0.1); }
        .auth-title { color:#FFF; font-size:clamp(22px,4vw,28px); font-weight:700; margin-bottom:10px; letter-spacing:-0.02em; line-height:1.2; animation: field-in 0.6s cubic-bezier(0.2,0.8,0.2,1) 0.15s both; }
        .auth-subtitle { color:#9CA3AF; font-size:14px; margin-bottom:32px; line-height:1.6; animation: field-in 0.6s cubic-bezier(0.2,0.8,0.2,1) 0.2s both; }
        .auth-form { animation: field-in 0.6s cubic-bezier(0.2,0.8,0.2,1) 0.25s both; }

        /* Fix browser autofill styling for dark theme */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          transition: background-color 5000s ease-in-out 0s;
          -webkit-text-fill-color: #FFFFFF !important;
        }
      `}</style>

      <div className="auth-bg">
        <div className="auth-orb bg-orb-a" />
        <div className="auth-orb bg-orb-b" />

        <div className="auth-card">
          <div className="auth-grid" />

          <div className="auth-card-content">
            <div className="auth-logo-wrapper">
              <img src="/logo.png" alt="CyberLabSec" style={{ height: 40, objectFit: "contain" }} />
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
