"use client";

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
  // Company portal: purple/pink. Employee portal: indigo/cyan.
  const accentRgb = isAdmin ? "168,85,247" : "99,102,241";
  const accentHex = isAdmin ? "#A855F7" : "#6366F1";
  const secondaryHex = isAdmin ? "#EC4899" : "#06B6D4";

  return (
    <>
      <style>{`
        /* ── Lock entire page to viewport, zero scroll ── */
        html, body, #__next {
          height: 100%;
          overflow: hidden;
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
          /* Pure CSS gradient — zero DOM blur, zero first-paint glitch */
          background:
            radial-gradient(ellipse 80% 60% at 10% 10%, rgba(${accentRgb},0.18) 0%, transparent 60%),
            radial-gradient(ellipse 70% 55% at 90% 90%, rgba(${accentRgb},0.12) 0%, transparent 60%),
            #050308;
          overflow: hidden; /* clip the subtle grid overlay */
        }

        /* Subtle dot-grid texture overlaid on background */
        .auth-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle, rgba(${accentRgb},0.08) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        /* ── The login card ── */
        .auth-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          /* On very small screens, card can scroll internally but never the page */
          max-height: calc(100svh - clamp(24px, 8vw, 48px));
          overflow-y: auto;
          scrollbar-width: none;
          border-radius: clamp(16px, 3vw, 24px);
          padding: clamp(28px, 7vw, 48px) clamp(24px, 6vw, 44px);
          background: rgba(10, 8, 18, 0.88);
          border: 1px solid rgba(${accentRgb}, 0.18);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 20px 60px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          /* Fade + slide in on load — CSS only, no JS, no FOUC */
          animation: authCardIn 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) both;
        }
        .auth-card::-webkit-scrollbar { display: none; }

        @keyframes authCardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        /* Top edge glow line */
        .auth-card::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%; height: 1px;
          background: linear-gradient(90deg, transparent, ${accentHex}cc, transparent);
          box-shadow: 0 0 16px ${accentHex}66;
          border-radius: 0 0 4px 4px;
        }
        /* Small secondary accent dot on top-right */
        .auth-card::after {
          content: '';
          position: absolute;
          top: -1px; right: 44px; width: 52px; height: 2px;
          background: ${secondaryHex};
          box-shadow: 0 0 10px ${secondaryHex}99;
          border-radius: 0 0 4px 4px;
          opacity: 0.8;
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
          margin-bottom: 28px;
        }
        .auth-logo-img {
          height: 36px;
          width: auto;
          object-fit: contain;
        }
        .auth-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(236,72,153,0.12);
          color: #F472B6;
          border: 1px solid rgba(236,72,153,0.3);
        }

        /* Headings */
        .auth-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }
        .auth-subtitle {
          margin: 0 0 28px;
          color: #6B7280;
          font-size: 14px;
          line-height: 1.65;
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

        /* ── Responsive tweaks ── */
        @media (max-height: 600px) {
          .auth-card {
            padding: 20px 20px;
          }
          .auth-logo-row { margin-bottom: 16px; }
          .auth-subtitle { margin-bottom: 16px; }
        }
        @media (max-width: 380px) {
          .auth-card {
            border-radius: 16px;
          }
        }

        /* Suppress motion if user prefers */
        @media (prefers-reduced-motion: reduce) {
          .auth-card { animation: none; }
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-inner">
            <div className="auth-logo-row">
              <img src="/logo.png" alt="CyberLabSec" className="auth-logo-img" />
              {isAdmin && <span className="auth-badge">Admin</span>}
            </div>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
