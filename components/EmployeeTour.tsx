"use client";

import { useState, useEffect } from "react";
import { Joyride, Step, CallBackProps, STATUS } from "react-joyride";
import confetti from "canvas-confetti";
import { X, ChevronRight, Check } from "lucide-react";

const TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    content: "Welcome to your Employee Portal! Let's take a quick look at your command center.",
    title: "Welcome Aboard 🚀",
    disableBeacon: true,
  },
  {
    target: "#tour-nav-dashboard",
    content: "This is your main dashboard where you can see a quick overview of your stats and recent activities.",
    title: "Dashboard Overview",
    placement: "right",
  },
  {
    target: "#tour-nav-tasks",
    content: "Here you can track your assigned tasks, submit your work, and monitor your progress using the Kanban board.",
    title: "Manage Tasks",
    placement: "right",
  },
  {
    target: "#tour-nav-documents",
    content: "Access your Offer Letter, NDAs, and other important documents safely here. All your signed records stay organized.",
    title: "Important Documents",
    placement: "right",
  },
  {
    target: "#tour-nav-team",
    content: "Collaborate with your team, join meetings, and chat with members seamlessly.",
    title: "Team Collaboration",
    placement: "right",
  },
  {
    target: "#tour-nav-leaderboard",
    content: "Compete and earn points for completing tasks on time! Check your ranking and badges here.",
    title: "Leaderboard & Points",
    placement: "right",
  },
];

const TooltipComponent = ({
  index,
  step,
  tooltipProps,
  primaryProps,
  skipProps,
  isLastStep,
}: any) => {
  return (
    <div
      {...tooltipProps}
      style={{
        background: "linear-gradient(145deg, rgba(20,20,30,0.95), rgba(10,10,15,0.98))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        borderRadius: "20px",
        padding: "24px",
        width: "340px",
        maxWidth: "90vw",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", top: -50, left: -50, width: 100, height: 100, background: "rgba(168,85,247,0.3)", filter: "blur(40px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
          {step.title}
        </h3>
        <button
          {...skipProps}
          style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "4px", borderRadius: "50%", transition: "0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.6", zIndex: 1, margin: "8px 0 16px" }}>
        {step.content}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{ width: i === index ? 16 : 6, height: 6, borderRadius: "3px", background: i === index ? "#a855f7" : "rgba(255,255,255,0.2)", transition: "all 0.3s ease" }}
            />
          ))}
        </div>
        
        <button
          {...primaryProps}
          style={{
            background: isLastStep ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #a855f7, #7e22ce)",
            color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex",
            alignItems: "center", gap: "6px", boxShadow: isLastStep ? "0 4px 15px rgba(16,185,129,0.3)" : "0 4px 15px rgba(168,85,247,0.3)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.filter = "none";
          }}
        >
          {isLastStep ? <><span style={{whiteSpace:"nowrap"}}>Get Started</span> <Check size={16} /></> : <><span style={{whiteSpace:"nowrap"}}>Explore</span> <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
};

export default function EmployeeTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenEmployeeTour");
    if (!hasSeenTour) {
      setTimeout(() => setRun(true), 1500); 
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action } = data;

    if (action === "next" || action === "close" || status === STATUS.FINISHED) {
      confetti({
        particleCount: status === STATUS.FINISHED ? 200 : 50,
        spread: status === STATUS.FINISHED ? 100 : 60,
        origin: { y: 0.8 },
        colors: ["#a855f7", "#3b82f6", "#10b981", "#eab308"]
      });
    }

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      localStorage.setItem("hasSeenEmployeeTour", "true");
    }
  };

  if (!run || typeof window === "undefined") return null;

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      disableOverlayClose
      spotlightPadding={8}
      tooltipComponent={TooltipComponent}
      styles={{
        options: { zIndex: 10000 },
        overlay: { backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)" },
      }}
      callback={handleJoyrideCallback}
    />
  );
}
