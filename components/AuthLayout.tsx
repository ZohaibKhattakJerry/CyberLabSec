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
        @keyframes orb-pulse-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.35; }
          50%       { transform: translate3d(20px, -20px, 0) scale(1.1); opacity: 0.5; }
        }
        @keyframes orb-pulse-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.28; }
          50%       { transform: translate3d(-20px, 20px, 0) scale(1.15); opacity: 0.45; }
        }
        @keyframes orb-pulse-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.25; }
          50%       { transform: translate3d(15px, 15px, 0) scale(1.05); opacity: 0.35; }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
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
          min-height: 100dvh;
          background: #040308;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          perspective: 1000px;
        }
        
        /* Ultra-subtle noise overlay for premium feel without lag */
        .auth-bg::before {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }

        .auth-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          filter: blur(40px); /* Hardware accelerated blur using standard CSS */
          transform: translateZ(0); /* Force GPU */
        }
        /* Background Orbs (Larger, Slower) */
        .bg-orb-a {
          width: 800px; height: 800px;
          top: -250px; left: -150px;
          background: rgba(168,85,247,0.18);
          animation: orb-pulse-a 14s ease-in-out infinite;
          z-index: 0;
        }
        .bg-orb-b {
          width: 700px; height: 700px;
          bottom: -250px; right: -150px;
          background: rgba(236,72,153,0.15);
          animation: orb-pulse-b 16s ease-in-out infinite 2s;
          z-index: 0;
        }
        
        /* Card Background */
        .auth-card {
          width: 100%; max-width: 400px;
          background: linear-gradient(145deg, rgba(13,12,20,0.92) 0%, rgba(17,14,26,0.95) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: clamp(16px, 4vw, 22px);
          padding: clamp(24px, 6vw, 44px) clamp(20px, 6vw, 44px);
          border: 1px solid rgba(168,85,247, 0.2);
          box-shadow: 0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative; z-index: 10;
          overflow: hidden;
          animation: card-in 0.3s cubic-bezier(0.16,1,0.3,1) both;
          transform: translateZ(0);
        }
        
        /* Card Orbs (Smaller, brighter, inside card) */
        .card-orb-a {
          width: 400px; height: 400px;
          top: -100px; left: -100px;
          background: rgba(168,85,247,0.4);
          animation: orb-pulse-a 9s ease-in-out infinite;
          filter: blur(50px);
          z-index: 0;
        }
        .card-orb-b {
          width: 350px; height: 350px;
          bottom: -100px; right: -100px;
          background: rgba(236,72,153,0.3);
          animation: orb-pulse-b 11s ease-in-out infinite 1.5s;
          filter: blur(50px);
          z-index: 0;
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
        .auth-scan {
          position: absolute; left: 0; right: 0; height: 2px;
          top: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.5) 40%, rgba(236,72,153,0.4) 60%, transparent 100%);
          pointer-events: none; 
          will-change: transform, opacity;
          animation: scan-line 8s linear infinite;
          z-index: 2;
          box-shadow: 0 0 10px rgba(168,85,247,0.4);
        }
        .auth-card-content {
          position: relative;
          z-index: 20;
        }
        .auth-card-glow {
          position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent);
          border-radius: 0 0 4px 4px;
          box-shadow: 0 1px 12px rgba(168,85,247,0.6);
        }
        .auth-card-accent {
          position: absolute; top: -1px; right: 40px; width: 60px; height: 2px;
          background: ${secondary}; border-radius: 0 0 4px 4px; opacity: 0.8;
          box-shadow: 0 1px 8px rgba(236,72,153,0.6);
        }
        .auth-logo-wrapper { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; animation: field-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .auth-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; border-radius: 6px; background: rgba(236,72,153,0.15); color: #F472B6; border: 1px solid rgba(236,72,153,0.3); }
        .auth-title { color:#FFF; font-size:clamp(20px,4vw,24px); font-weight:700; margin-bottom:8px; letter-spacing:-0.02em; line-height:1.2; animation: field-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .auth-subtitle { color:#6B7280; font-size:14px; margin-bottom:24px; line-height:1.6; animation: field-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .auth-form { animation: field-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.25s both; }

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
        {/* Full-screen background orbs for immersive feel */}
        <div className="auth-orb bg-orb-a" />
        <div className="auth-orb bg-orb-b" />

        <div className="auth-card">
          {/* GPU-composited orbs INSIDE the card */}
          <div className="auth-orb card-orb-a" />
          <div className="auth-orb card-orb-b" />
          <div className="auth-grid" />
          <div className="auth-scan" />

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
