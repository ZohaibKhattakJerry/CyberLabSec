"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const accentRgb = isAdmin ? "168,85,247" : "99,102,241";
  const accentHex = isAdmin ? "#A855F7" : "#6366F1";
  const secondaryHex = isAdmin ? "#EC4899" : "#06B6D4";
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        /* ── Lock entire page to viewport, zero scroll ── */
        html, body, #__next {
          height: 100%;
          overflow: hidden;
          background: #050308;
        }

        /* ── Full-screen auth wrapper ── */
        .auth-root {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(12px, 4vw, 24px);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        /* Subtle dot-grid texture overlaid on background */
        .auth-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 1;
          mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
        }

        /* ── The login card ── */
        .auth-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          max-height: calc(100svh - clamp(24px, 8vw, 48px));
          overflow-y: auto;
          scrollbar-width: none;
          border-radius: clamp(16px, 3vw, 24px);
          padding: clamp(32px, 7vw, 48px) clamp(24px, 6vw, 44px);
          background: rgba(10, 8, 14, 0.6);
          border: 1px solid rgba(${accentRgb}, 0.15);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 30px 60px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(28px) saturate(1.5);
          -webkit-backdrop-filter: blur(28px) saturate(1.5);
        }
        .auth-card::-webkit-scrollbar { display: none; }

        /* Top edge glow line */
        .auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, ${accentHex}cc, transparent);
          box-shadow: 0 0 20px ${accentHex}88;
          border-radius: 0 0 4px 4px;
        }

        /* ── Card inner content ── */
        .auth-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Logo row */
        .auth-logo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .auth-logo-img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }
        .auth-badge {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(236,72,153,0.12);
          color: #F472B6;
          border: 1px solid rgba(236,72,153,0.3);
          box-shadow: 0 0 12px rgba(236,72,153,0.2);
        }

        /* Headings */
        .auth-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: clamp(24px, 4vw, 28px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          background: linear-gradient(to right, #ffffff, #a1a1aa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-subtitle {
          margin: 0 0 32px;
          color: #9CA3AF;
          font-size: 14.5px;
          line-height: 1.6;
        }

        /* Autofill dark theme override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 50px #0d0b16 inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff !important;
          transition: background-color 5000s ease 0s;
        }

        @media (max-width: 380px) {
          .auth-card {
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="auth-root">
        
        {/* Dynamic interactive background blobs */}
        <motion.div 
          animate={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(${accentRgb},0.2) 0%, transparent 50%)`
          }}
          transition={{ type: "tween", ease: "linear", duration: 0.2 }}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
        
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "10%", left: "10%", width: "50vw", height: "50vw", background: `radial-gradient(circle, rgba(${isAdmin ? "168,85,247" : "99,102,241"},0.15) 0%, transparent 60%)`, zIndex: 0, pointerEvents: "none" }}
        />
        
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ position: "absolute", bottom: "10%", right: "10%", width: "60vw", height: "60vw", background: `radial-gradient(circle, rgba(${isAdmin ? "236,72,153" : "6,182,212"},0.1) 0%, transparent 60%)`, zIndex: 0, pointerEvents: "none" }}
        />

        <div className="auth-grid" />

        {/* Premium Card Entrance */}
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-inner">
            <motion.div 
              className="auth-logo-row"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img src="/logo.png" alt="CyberLabSec" className="auth-logo-img" />
              {isAdmin && <span className="auth-badge">Admin</span>}
            </motion.div>
            
            <motion.h1 
              className="auth-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="auth-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {subtitle}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
