"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
  
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  return (
    <>
      <style>{`
        html, body, #__next {
          height: 100%;
          overflow: hidden;
          background: #050308;
        }

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

        .auth-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          max-height: calc(100svh - clamp(24px, 8vw, 48px));
          overflow-y: auto;
          scrollbar-width: none;
          border-radius: clamp(16px, 3vw, 24px);
          padding: clamp(28px, 6vw, 44px) clamp(20px, 5vw, 40px);
          background: rgba(10, 8, 14, 0.65);
          border: 1px solid rgba(${accentRgb}, 0.18);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 30px 60px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(28px) saturate(1.5);
          -webkit-backdrop-filter: blur(28px) saturate(1.5);
        }
        .auth-card::-webkit-scrollbar { display: none; }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, ${accentHex}cc, transparent);
          box-shadow: 0 0 20px ${accentHex}88;
          border-radius: 0 0 4px 4px;
        }

        .auth-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .auth-logo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .auth-logo-img {
          height: 38px;
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

        .auth-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: clamp(22px, 4vw, 27px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          background: linear-gradient(to right, #ffffff, #a1a1aa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-subtitle {
          margin: 0 0 28px;
          color: #9CA3AF;
          font-size: 14px;
          line-height: 1.6;
        }

        /* --- Input fields --- */
        .auth-input-wrapper {
          position: relative;
          margin-bottom: 0;
        }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 13px 44px 13px 44px;
          color: #FFFFFF;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
          -webkit-appearance: none;
          appearance: none;
        }
        .auth-input:focus {
          background: rgba(${accentRgb}, 0.06);
          border-color: rgba(${accentRgb}, 0.5);
          box-shadow: 0 0 0 3px rgba(${accentRgb}, 0.1);
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }

        /* --- Submit button with touch-friendly active state --- */
        .auth-submit-btn {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, ${accentHex}, ${isAdmin ? "#7C3AED" : "#4338CA"});
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: -0.01em;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.3s ease, opacity 0.3s ease;
          box-shadow: 0 4px 20px rgba(${accentRgb}, 0.3);
          font-family: inherit;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .auth-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(${accentRgb}, 0.45);
        }
        .auth-submit-btn:active {
          transform: scale(0.97) translateY(0px);
          box-shadow: 0 2px 10px rgba(${accentRgb}, 0.25);
        }
        .auth-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }
        .auth-submit-btn.success {
          background: linear-gradient(135deg, #22C55E, #16A34A);
          box-shadow: 0 4px 20px rgba(34,197,94,0.3);
        }

        /* --- Icon buttons (show/hide password) --- */
        .auth-icon-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #4B5563;
          display: flex;
          padding: 6px;
          border-radius: 6px;
          transition: color 0.2s ease, background 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .auth-icon-btn:hover { color: ${accentHex}; background: rgba(${accentRgb}, 0.1); }
        .auth-icon-btn:active { color: ${accentHex}; background: rgba(${accentRgb}, 0.2); transform: translateY(-50%) scale(0.9); }

        /* --- Links --- */
        .auth-link {
          color: ${accentHex};
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 4px 0;
          transition: color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .auth-link:hover { color: #C084FC; }
        .auth-link:active { opacity: 0.7; }

        .auth-link-muted {
          color: #4B5563;
          text-decoration: none;
          font-size: 12px;
          padding: 4px 0;
          transition: color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .auth-link-muted:hover { color: #6B7280; }
        .auth-link-muted:active { opacity: 0.7; }

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
            padding: 24px 16px;
          }
        }

        @keyframes spinner-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner-anim { animation: spinner-rotate 0.8s linear infinite; }
      `}</style>

      <div className="auth-root">
        
        {/* Dynamic interactive background */}
        <motion.div 
          animate={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(${accentRgb},0.18) 0%, transparent 55%)`
          }}
          transition={{ type: "tween", ease: "linear", duration: 0.3 }}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
        
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "5%", left: "5%", width: "55vw", height: "55vw", background: `radial-gradient(circle, rgba(${isAdmin ? "168,85,247" : "99,102,241"},0.12) 0%, transparent 60%)`, zIndex: 0, pointerEvents: "none", borderRadius: "50%" }}
        />
        
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ position: "absolute", bottom: "5%", right: "5%", width: "65vw", height: "65vw", background: `radial-gradient(circle, rgba(${isAdmin ? "236,72,153" : "6,182,212"},0.08) 0%, transparent 60%)`, zIndex: 0, pointerEvents: "none", borderRadius: "50%" }}
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
