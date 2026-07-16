import React from "react";
import Link from "next/link";

interface PublicNavProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PublicNav({ left, center, right, className = "", style = {} }: PublicNavProps) {
  return (
    <nav
      className={`public-nav ${className}`}
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        {left}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        {center || (
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 40, width: "auto", objectFit: "contain" }} />
          </Link>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, flex: 1 }}>
        {right}
      </div>
    </nav>
  );
}
