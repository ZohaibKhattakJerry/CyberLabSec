import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "CyberLabSec — Ops Platform",
    template: "%s | CyberLabSec",
  },
  description: "CyberLabSec internal operations platform — Career Portal, Employee Portal, and Admin Dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-full" style={{ fontFamily: "var(--font-inter), sans-serif" }} suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#121220",
              border: "1px solid rgba(168,85,247,0.2)",
              color: "#f1f5f9",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#121220" },
            },
            error: {
              iconTheme: { primary: "#A855F7", secondary: "#121220" },
            },
          }}
        />
      </body>
    </html>
  );
}
