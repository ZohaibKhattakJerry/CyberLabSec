"use client";

import { motion } from "framer-motion";
import React from "react";

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      <motion.div
        className="card w-full max-w-md p-8 md:p-10 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="CyberLabSec Logo"
            style={{ height: 40, objectFit: "contain" }}
          />
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14,
            marginBottom: 28,
          }}
        >
          {subtitle}
        </p>

        {children}
      </motion.div>
    </div>
  );
}
