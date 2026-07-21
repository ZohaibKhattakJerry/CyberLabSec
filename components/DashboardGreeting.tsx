"use client";

import { useEffect, useState } from "react";

export default function DashboardGreeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState("Good Day");
  const [emoji, setEmoji] = useState("👋");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      // User requested "PST time", but typically a client-side date object uses their local time.
      // If we strictly want PST (UTC+5) real-time, we can calculate it:
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pstDate = new Date(utc + (3600000 * 5));
      const hour = pstDate.getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
        setEmoji("☀️");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
        setEmoji("⛅");
      } else if (hour >= 17 && hour < 20) {
        setGreeting("Good Evening");
        setEmoji("🌅");
      } else {
        setGreeting("Good Night");
        setEmoji("🌙");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Check every minute for real-time updates
    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="dash-hero-title" style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.03em', lineHeight: 1.15, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{greeting},</span>
      <span style={{ background: 'linear-gradient(90deg, #A855F7, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}</span>
      <span className="animate-fade-up" style={{ display: 'inline-block', animationDuration: '0.8s' }} key={emoji}>{emoji}</span>
    </h1>
  );
}
