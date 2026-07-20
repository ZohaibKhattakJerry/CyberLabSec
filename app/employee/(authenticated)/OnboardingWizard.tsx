"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, ChevronRight, ChevronLeft, CheckCircle, Info, Lock, BookOpen, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface Employee {
  id: string;
  name: string;
  designation: string;
  team: { id: string; name: string } | null;
}

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "ceo", title: "CEO Message" },
  { id: "overview", title: "Overview" },
  { id: "portal", title: "Portal Tour" },
  { id: "rules", title: "Guidelines" },
  { id: "nda", title: "NDA & Policies" },
  { id: "complete", title: "Ready" },
];

export default function OnboardingWizard({ employee }: { employee: Employee }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [agreedNDA, setAgreedNDA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedStep = localStorage.getItem(`onboarding_step_${employee.id}`);
    if (savedStep) setCurrentStep(parseInt(savedStep));
    const savedNDA = localStorage.getItem(`onboarding_nda_${employee.id}`);
    if (savedNDA === "true") setAgreedNDA(true);
  }, [employee.id]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(`onboarding_step_${employee.id}`, currentStep.toString());
      localStorage.setItem(`onboarding_nda_${employee.id}`, agreedNDA.toString());
    }
  }, [currentStep, agreedNDA, employee.id, mounted]);

  const handleNext = () => {
    const stepId = STEPS[currentStep].id;
    if (stepId === "nda" && !agreedNDA) {
      toast.error("You must accept the Non-Disclosure Agreement to continue.");
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep((c) => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((c) => c - 1);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to complete onboarding.");
      localStorage.removeItem(`onboarding_step_${employee.id}`);
      localStorage.removeItem(`onboarding_nda_${employee.id}`);
      toast.success("Welcome aboard!");
      router.refresh();
    } catch {
      toast.error("Error completing onboarding.");
      setLoading(false);
    }
  };

  const renderContent = () => {
    const stepId = STEPS[currentStep].id;
    switch (stepId) {
      case "welcome":
        return (
          <div className="text-center py-12">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <img src="/logo.png" alt="CyberLabSec Logo" style={{ height: 60, objectFit: "contain" }} />
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Welcome, {employee.name}!</h1>
            <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto 40px" }}>
              We are thrilled to have you join CyberLabSec as our new <span style={{ color: "var(--purple)", fontWeight: 600 }}>{employee.designation}</span>.
              This wizard will guide you through our core principles, platform tools, and security policies.
            </p>
          </div>
        );
      case "ceo":
        return (
          <div className="py-8">
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <Shield size={24} color="var(--purple)" /> CEO Welcome Message
            </h2>
            <div className="card" style={{ padding: "clamp(20px, 4vw, 32px)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "white", flexShrink: 0 }}>
                    ZK
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Zohaib Khattak</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>CEO & Founder, CyberLabSec</p>
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.7, fontSize: 15, paddingLeft: 16, borderLeft: "4px solid var(--border-accent)" }}>
                  <p style={{ marginBottom: 12 }}>&quot;Welcome to the team! We founded CyberLabSec with a singular vision: to build the most elite, proactive defense force in the digital realm. As you step into your new role, remember that you are now part of a family that values integrity, innovation, and relentless pursuit of security.&quot;</p>
                  <p>&quot;We rely on your expertise to secure the future. I am incredibly excited to see the impact you will make here. Let&apos;s build something extraordinary together.&quot;</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "overview":
        return (
          <div className="py-8">
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <Info size={24} color="var(--purple)" /> Company Mission & Vision
            </h2>
            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Our Mission</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                At CyberLabSec, our mission is to proactively identify and neutralize digital threats before they can be exploited. 
                We act as the ultimate line of defense for critical infrastructures worldwide.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Your Role</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                As part of the <strong>{employee.team?.name || "CyberLabSec Team"}</strong>, you will be expected to maintain the highest standards of operational security (OPSEC) while executing your assigned tasks.
              </p>
            </div>
          </div>
        );
      case "portal":
        return (
          <div className="py-8">
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <BookOpen size={24} color="var(--purple)" /> Employee Portal Guide
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>📋 Tasks</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>View active assignments, deadlines, and operational briefs. Always submit your reports before the deadline.</p>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>📤 Submissions</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Upload your findings securely. The system automatically analyzes reports using AI for rapid review.</p>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>👥 Team</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Collaborate with your squad. View team announcements and secure comms.</p>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>🔔 Announcements</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Real-time updates from CyberLabSec Command regarding global intel and system events.</p>
              </div>
            </div>
          </div>
        );
      case "rules":
        return (
          <div className="py-8">
             <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={24} color="var(--purple)" /> Operational Rules
            </h2>
            <div className="card" style={{ padding: 32 }}>
              <ul style={{ display: "flex", flexDirection: "column", gap: 16, color: "var(--text-secondary)" }}>
                <li style={{ display: "flex", gap: 12 }}><CheckCircle size={20} color="var(--purple)" style={{ flexShrink: 0 }} /> <strong>Strict Confidentiality:</strong> No internal data or task details may be shared externally.</li>
                <li style={{ display: "flex", gap: 12 }}><CheckCircle size={20} color="var(--purple)" style={{ flexShrink: 0 }} /> <strong>Timely Submissions:</strong> Late submissions are flagged and directly affect your performance metrics.</li>
                <li style={{ display: "flex", gap: 12 }}><CheckCircle size={20} color="var(--purple)" style={{ flexShrink: 0 }} /> <strong>Zero Tolerance for Plagiarism:</strong> All code and reports are scanned. AI-generated content without disclosure will result in immediate review.</li>
                <li style={{ display: "flex", gap: 12 }}><CheckCircle size={20} color="var(--purple)" style={{ flexShrink: 0 }} /> <strong>Professional Conduct:</strong> Maintain professional communication at all times.</li>
              </ul>
            </div>
          </div>
        );
      case "nda":
        return (
          <div className="py-8">
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <Lock size={24} color="var(--purple)" /> Non-Disclosure Agreement
            </h2>
            <div className="card" style={{ padding: 32, marginBottom: 24, maxHeight: 300, overflowY: "auto", fontSize: 14, color: "var(--text-muted)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <h4 style={{ color: "var(--text-primary)", marginBottom: 12, fontWeight: 600 }}>CONFIDENTIALITY POLICY</h4>
              <p style={{ marginBottom: 16 }}>As an employee of CyberLabSec, you will have access to highly sensitive and classified information regarding our clients, proprietary methodologies, and ongoing security operations.</p>
              <p style={{ marginBottom: 16 }}>1. You agree not to disclose, share, or distribute any proprietary tools, vulnerability reports, or internal communications with any unauthorized third parties.</p>
              <p style={{ marginBottom: 16 }}>2. You agree that any security research or exploits developed during your employment are the sole intellectual property of CyberLabSec.</p>
              <p>Failure to comply with this agreement will result in immediate termination and potential legal action.</p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "var(--bg-card)", padding: 20, borderRadius: 12, border: "1px solid var(--border)" }}>
              <input type="checkbox" checked={agreedNDA} onChange={(e) => setAgreedNDA(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--purple)" }} />
              <span style={{ fontWeight: 500 }}>I have read and agree to the Non-Disclosure Agreement & Platform Policies.</span>
            </label>
          </div>
        );

      case "complete":
        return (
           <div className="text-center py-12">
            <div style={{ width: 80, height: 80, background: "rgba(34, 197, 94, 0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>You are all set!</h1>
            <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto 40px" }}>
              Your workspace is ready. Click the button below to enter the CyberLabSec Employee Portal and view your dashboard.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 800 }}>
        {/* Progress Bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 10, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {STEPS.map((step, idx) => (
            <div key={step.id} style={{ flex: "1 1 auto", minWidth: 60 }}>
              <div style={{ 
                height: 4, borderRadius: 2, 
                background: idx <= currentStep ? "var(--purple)" : "var(--border)",
                transition: "background 0.3s"
              }} />
              <div className="hidden sm:block" style={{ fontSize: 11, marginTop: 8, color: idx === currentStep ? "var(--purple)" : "var(--text-muted)", fontWeight: idx === currentStep ? 600 : 400, transition: "color 0.3s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {step.title}
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ minHeight: 400 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, borderTop: "1px solid var(--border)", paddingTop: 32, gap: 16 }}>
          <button 
            onClick={handleBack} 
            disabled={currentStep === 0 || loading}
            className="btn btn-secondary"
            style={{ visibility: currentStep === 0 ? "hidden" : "visible", gap: 8, padding: "10px 16px" }}
          >
            <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button onClick={completeOnboarding} disabled={loading} className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 16, gap: 10, flex: 1, maxWidth: 220 }}>
              {loading ? "Processing..." : "Enter Workspace"} <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleNext} className="btn btn-primary" style={{ gap: 8, padding: "10px 24px", flex: 1, maxWidth: 220 }}>
              Next Step <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
