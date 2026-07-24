"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, CheckCircle, Info, BookOpen, AlertTriangle, FileSignature, X,
  Loader2, Check, ArrowRight, LayoutDashboard, FileText, CheckSquare,
  Users, Trophy, ChevronDown, ChevronUp, Download, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";

interface Employee {
  id: string;
  name: string;
  designation: string;
  employmentType: string | null;
  team: { id: string; name: string } | null;
}

const STEPS = [
  { id: "welcome",  title: "Welcome",    icon: "👋" },
  { id: "ceo",      title: "Message",    icon: "💬" },
  { id: "overview", title: "Mission",    icon: "🎯" },
  { id: "portal",   title: "Tour",       icon: "🗺️" },
  { id: "rules",    title: "Guidelines", icon: "📋" },
  { id: "nda",      title: "Documents",  icon: "📝" },
  { id: "complete", title: "Ready",      icon: "🚀" },
];

const PORTAL_TABS = [
  { icon: <LayoutDashboard size={18} />, title: "Dashboard", color: "from-indigo-500 to-purple-600", desc: "Your command center. View upcoming deadlines, live performance scores, team announcements, and your attendance streak all in one place.", tips: ["Check deadlines daily", "Monitor your points", "Read pinned announcements"] },
  { icon: <CheckSquare size={18} />, title: "Tasks", color: "from-blue-500 to-cyan-500", desc: "Receive operational briefs from your team lead. Each task has a deadline, priority level, and deliverable type. Submit your findings through the secure portal.", tips: ["Always submit before deadline", "Attach evidence files", "Check the scope rules"] },
  { icon: <FileText size={18} />, title: "Documents", color: "from-emerald-500 to-green-400", desc: "All your official documents live here — from your Offer Letter and signed NDA to training certificates. You can also request admin-issued documents here.", tips: ["Download signed PDFs", "Request certificates", "Track document status"] },
  { icon: <Users size={18} />, title: "Team", color: "from-rose-500 to-pink-500", desc: "Communicate securely with your squad and team lead. Propose meetings, vote on time slots, and stay in sync with real-time team chat.", tips: ["Use team chat for updates", "Propose meetings here", "View team members"] },
  { icon: <Trophy size={18} />, title: "Leaderboard", color: "from-amber-500 to-orange-400", desc: "Earn points by completing tasks and climbing the global leaderboard. Your performance score directly impacts your tier and future opportunities at CyberLabSec.", tips: ["Higher score = better tier", "Monthly resets", "Top 3 get recognition"] },
];

export default function OnboardingWizard({ employee }: { employee: Employee }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Documents state
  const [dbDocs, setDbDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [offerLetter, setOfferLetter] = useState<any | null>(null);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [showOfferLetter, setShowOfferLetter] = useState(false);

  // Tour state
  const [activeTourTab, setActiveTourTab] = useState(0);
  const [exploredTabs, setExploredTabs] = useState<Set<number>>(new Set([0]));

  const empType = employee.employmentType || "Employee";

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const [docsRes, myDocsRes] = await Promise.all([
        fetch("/api/employee/onboarding/documents"),
        fetch("/api/employee/my-documents"),
      ]);
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDbDocs(data.documents || []);
      }
      if (myDocsRes.ok) {
        const myData = await myDocsRes.json();
        const ol = (myData.documents || []).find((d: any) =>
          ["Offer Letter", "Job Offer Letter", "Internship Offer Letter", "Initial Offer Letter", "Contract Offer Letter"].some(t => d.title?.includes(t))
        );
        setOfferLetter(ol || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDocs();
    // Clear the small tour flag so it triggers exactly once after this big wizard finishes
    if (typeof window !== "undefined") {
      localStorage.removeItem("hasSeenEmployeeTour");
    }
  }, []);

  const pendingCount = dbDocs.filter(d => !d.isSigned).length;

  const handleNext = () => {
    if (STEPS[currentStep].id === "nda" && pendingCount > 0) {
      toast.error("Please sign all required documents to continue.", { style: { background: "#1a1a2e", color: "#fff" } });
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/onboarding", { method: "POST" });
      if (res.ok) {
        toast.success("Welcome aboard!");
        router.refresh();
      } else {
        throw new Error("Failed to complete onboarding.");
      }
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
      toast.success("Welcome to CyberLabSec! 🎉");
      router.push("/employee/dashboard");
      router.refresh();
    } catch {
      toast.error("Error completing onboarding.");
      setLoading(false);
    }
  };

  const handleSign = async (doc: any) => {
    if (!agreedToTerms || !signerName.trim()) return;
    setSigningDocId(doc.id);

    try {
      toast.loading("Generating signed document...", { id: "sign-doc", style: { background: "#1a1a2e", color: "#fff" } });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const W = 595;

      // Header
      pdf.setFillColor(15, 15, 30);
      pdf.rect(0, 0, W, 100, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(255, 255, 255);
      pdf.text("CYBERLAB SECURITY", 40, 50);
      pdf.setFontSize(12);
      pdf.setTextColor(160, 120, 220);
      pdf.text(doc.title.toUpperCase(), 40, 72);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 170);
      pdf.text(`Generated: ${format(new Date(), "MMMM dd, yyyy")} | Confidential`, 40, 90);

      // Body
      pdf.setTextColor(30, 30, 50);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      let y = 125;

      const intro = `This agreement is made effective as of ${format(new Date(), "MMMM dd, yyyy")}, by and between CyberLab Security ("Company") and ${employee.name} ("${empType}").`;
      const introLines = pdf.splitTextToSize(intro, W - 80);
      pdf.text(introLines, 40, y);
      y += introLines.length * 16 + 20;

      const bodyLines = pdf.splitTextToSize(doc.bodyText || "", W - 80);
      pdf.text(bodyLines, 40, y);
      y = Math.max(y + bodyLines.length * 14 + 40, 450);

      // Signature block
      pdf.setDrawColor(200, 200, 220);
      pdf.line(40, y, W - 40, y);
      y += 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 120);
      pdf.text("DIGITAL SIGNATURES & ACCEPTANCE RECORD", 40, y);
      y += 25;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Accepted By (${empType})`, 40, y);
      pdf.text("Authorized By (CyberLab Security)", 320, y);
      y += 18;
      pdf.setFont("times", "italic");
      pdf.setFontSize(20);
      pdf.setTextColor(0, 51, 153);
      pdf.text(signerName, 40, y);
      pdf.text("CyberLab HR Authority", 320, y);
      y += 18;
      pdf.setFont("courier", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 150);
      pdf.text(`Timestamp: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")} UTC`, 40, y);
      pdf.text("System-verified digital signature", 320, y);

      const base64Pdf = pdf.output("datauristring");

      toast.loading("Saving signature...", { id: "sign-doc" });
      const res = await fetch("/api/employee/onboarding/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, signerName, pdfFileUrl: base64Pdf }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign");

      toast.success(`${doc.title} signed! ✅`, { id: "sign-doc" });
      setExpandedDocId(null);
      setSignerName("");
      setAgreedToTerms(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, zIndex: 9999 });
      await fetchDocs();
    } catch (err: any) {
      toast.error(err.message, { id: "sign-doc" });
    } finally {
      setSigningDocId(null);
    }
  };

  const renderContent = () => {
    switch (STEPS[currentStep].id) {
      case "welcome":
        return (
          <div className="ob-step-fade text-center py-4 sm:py-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-xl" />
                <img src="/logo.png" alt="CyberLabSec" className="relative h-14 sm:h-16 object-contain" />
              </div>
            </div>
            <h1 className="ob-hero-title">Welcome, <span className="ob-gradient-text">{employee.name}</span>!</h1>
            <p className="ob-subtitle">
              You've joined CyberLabSec as our new <strong className="text-indigo-300">{employee.designation}</strong>
              {employee.team ? <> in the <strong className="text-purple-300">{employee.team.name}</strong> team</> : ""}.
            </p>
            <p className="ob-subtitle mt-4">
              This quick wizard will guide you through our mission, platform tour, security policies, and required documents. It takes about <strong className="text-white">5 minutes</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {STEPS.slice(1).map((s, i) => (
                <span key={i} className="ob-pill">{s.icon} {s.title}</span>
              ))}
            </div>
          </div>
        );

      case "ceo":
        return (
          <div className="ob-step-fade py-2 sm:py-4">
            <h2 className="ob-section-title"><Shield className="ob-icon-purple" size={22} /> Welcome Message</h2>
            <div className="ob-card relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600" />
              <div className="flex flex-col md:flex-row gap-5 items-start pl-4">
                <div className="ob-avatar flex-shrink-0">ZK</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Zohaib Khattak</h3>
                  <p className="text-indigo-400 text-sm font-semibold mb-5">CEO & Founder, CyberLabSec</p>
                  <div className="space-y-4 text-gray-300 italic leading-relaxed text-[15px]">
                    <p>&quot;Welcome to the team! We founded CyberLabSec with a singular vision: to build the most elite, proactive cyber defense force in the digital realm. As you step into your new role, know that you are part of a family that values integrity, innovation, and relentless pursuit of security.&quot;</p>
                    <p>&quot;We rely on your expertise to protect critical infrastructure worldwide. I&apos;m excited to see the impact you will make. Let&apos;s build something extraordinary — together.&quot;</p>
                  </div>
                  <p className="mt-5 font-signature text-2xl text-indigo-400">Zohaib Khattak</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "overview":
        return (
          <div className="ob-step-fade py-2 sm:py-4">
            <h2 className="ob-section-title"><Info className="ob-icon-purple" size={22} /> Our Mission & Your Role</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="ob-card ob-card-hover">
                <div className="ob-icon-box ob-icon-blue mb-4"><Shield size={20} /></div>
                <h3 className="text-white font-bold text-lg mb-2">Our Mission</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  At CyberLabSec, we proactively identify and neutralize digital threats before they can be exploited. We are the ultimate defense line for critical infrastructures worldwide — operating with zero tolerance for compromise.
                </p>
              </div>
              <div className="ob-card ob-card-hover">
                <div className="ob-icon-box ob-icon-purple mb-4"><Users size={20} /></div>
                <h3 className="text-white font-bold text-lg mb-2">Your Role</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  As <strong className="text-white">{employee.designation}</strong> in the <strong className="text-white">{employee.team?.name || "CyberLabSec"}</strong> team, you will maintain the highest OPSEC standards while executing mission-critical assignments and protecting our clients.
                </p>
              </div>
              <div className="ob-card ob-card-hover md:col-span-2">
                <div className="ob-icon-box ob-icon-amber mb-4"><Trophy size={20} /></div>
                <h3 className="text-white font-bold text-lg mb-2">How We Operate</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  All employees operate on a <strong className="text-white">points-based performance system</strong>. Complete tasks on time, submit quality reports, and participate in team activities to climb the leaderboard and unlock higher tier clearances.
                </p>
              </div>
            </div>
          </div>
        );

      case "portal":
        return (
          <div className="ob-step-fade py-2 sm:py-4">
            <h2 className="ob-section-title"><BookOpen className="ob-icon-purple" size={22} /> Portal Features Tour</h2>
            <p className="text-gray-400 text-sm mb-4 sm:mb-6">Explore the tools you'll use every day. Click each section or click Explore below to learn more.</p>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Tab list */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-48 flex-shrink-0">
                {PORTAL_TABS.map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveTourTab(idx);
                      if (!exploredTabs.has(idx)) {
                        setExploredTabs(prev => new Set(prev).add(idx));
                        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 }, zIndex: 9999, colors: ['#6366f1', '#a855f7', '#3b82f6'] });
                      }
                    }}
                    className={`ob-tour-tab ${activeTourTab === idx ? "ob-tour-tab-active" : ""}`}
                  >
                    <span className={`ob-tour-tab-icon ${activeTourTab === idx ? "ob-tour-tab-icon-active" : ""}`}>{tab.icon}</span>
                    <span className="text-sm font-semibold whitespace-nowrap">{tab.title}</span>
                  </button>
                ))}
              </div>
              {/* Tab content */}
              <div className="flex-1 ob-card ob-tour-content">
                <div className={`w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${PORTAL_TABS[activeTourTab].color} flex items-center justify-center text-white shadow-lg`}>
                  {PORTAL_TABS[activeTourTab].icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{PORTAL_TABS[activeTourTab].title}</h3>
                <p className="text-gray-300 leading-relaxed mb-5">{PORTAL_TABS[activeTourTab].desc}</p>
                <div className="space-y-2">
                  {PORTAL_TABS[activeTourTab].tips.map((tip, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 text-xs font-bold">{i + 1}</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "rules":
        return (
          <div className="ob-step-fade py-2 sm:py-4">
            <h2 className="ob-section-title"><AlertTriangle className="ob-icon-purple" size={22} /> Operational Rules</h2>
            <div className="space-y-3">
              {[
                { title: "Strict Confidentiality", desc: "No internal data, task details, or client information may be shared externally under any circumstances.", icon: "🔒", color: "ob-rule-red" },
                { title: "Timely Submissions", desc: "Late submissions are automatically flagged and directly impact your performance metrics and tier rating.", icon: "⏱️", color: "ob-rule-amber" },
                { title: "Zero Plagiarism", desc: "All code and reports are AI-scanned. Undisclosed AI-generated content will result in immediate performance review.", icon: "🧠", color: "ob-rule-blue" },
                { title: "Professional Conduct", desc: "Maintain professional communication in all channels at all times. CyberLabSec has zero tolerance for harassment.", icon: "🤝", color: "ob-rule-green" },
              ].map((rule, idx) => (
                <div key={idx} className={`ob-rule-card ${rule.color}`}>
                  <div className="ob-rule-icon">{rule.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm mb-1">{rule.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{rule.desc}</p>
                  </div>
                  <Check className="text-emerald-400 flex-shrink-0" size={18} />
                </div>
              ))}
            </div>
          </div>
        );

      case "nda":
        return (
          <div className="ob-step-fade py-2 sm:py-3">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
                <FileSignature size={22} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Official Signatures Required</h2>
              <p className="text-gray-400 text-xs max-w-lg mx-auto leading-relaxed">
                Sign all required documents below. Each signed PDF is saved to your <strong className="text-white">My Documents</strong> section.
              </p>
            </div>

            {/* Offer Letter — compact row */}
            {offerLetter && (
              <div className="ob-offer-card mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">Your Offer Letter</p>
                    <p className="text-gray-400 text-xs">Issued upon hire — review before signing</p>
                  </div>
                  {offerLetter.fileUrl && (
                    <a href={offerLetter.fileUrl} target="_blank" rel="noreferrer" className="ob-btn-secondary ob-btn-sm flex-shrink-0">
                      <Download size={12} /> View
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Documents list — compact cards, click to open modal */}
            {loadingDocs ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
            ) : dbDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No documents require your signature at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dbDocs.map((doc) => {
                  const isSigned = doc.isSigned;
                  return (
                    <div key={doc.id} className={`ob-doc-card ${isSigned ? "ob-doc-signed" : "ob-doc-pending"}`}>
                      <div className="flex items-center gap-3 p-4 w-full">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSigned ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
                          {isSigned ? <CheckCircle size={18} /> : <FileSignature size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-sm">{doc.title}</span>
                            {isSigned
                              ? <span className="ob-badge-signed">✓ Signed</span>
                              : <span className="ob-badge-pending">Action Required</span>
                            }
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{doc.subtitle}</p>
                        </div>
                        {!isSigned && (
                          <button
                            onClick={() => { setExpandedDocId(doc.id); setAgreedToTerms(false); setSignerName(""); }}
                            className="ob-sign-btn-mini flex-shrink-0"
                          >
                            <FileSignature size={14} /> Sign
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {pendingCount === 0 && dbDocs.length > 0 && (
                  <div className="ob-all-signed">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                    <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                    <h3 className="text-base font-bold text-white mb-1">All Documents Signed!</h3>
                    <p className="text-emerald-400 text-sm">You can now proceed to complete your onboarding.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── SIGN MODAL ─────────────────────────────────────────────── */}
            {expandedDocId && (() => {
              const doc = dbDocs.find(d => d.id === expandedDocId);
              if (!doc) return null;
              const isSigning = signingDocId === doc.id;
              const canSign = agreedToTerms && signerName.trim().length > 0;
              return (
                <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
                  <div style={{ background: "linear-gradient(180deg, #0d0c17 0%, #08060e 100%)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "24px", width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                    {/* Modal Header */}
                    <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileSignature size={18} style={{ color: "#818cf8" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>{doc.title}</h3>
                        <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>{doc.subtitle}</p>
                      </div>
                      <button onClick={() => setExpandedDocId(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px", color: "#9ca3af", cursor: "pointer" }}>
                        <X size={16} />
                      </button>
                    </div>

                    {/* Scrollable doc body */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }} className="custom-scrollbar">
                      <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                        <div style={{ textAlign: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <p style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>CyberLab Security</p>
                          <h4 style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0 }}>{doc.title}</h4>
                          <p style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>Effective {format(new Date(), "MMMM dd, yyyy")}</p>
                        </div>
                        <p style={{ color: "#d1d5db", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
                          This agreement is made effective as of <strong style={{ color: "#fff" }}>{format(new Date(), "MMMM dd, yyyy")}</strong>, by and between{" "}
                          <strong style={{ color: "#fff" }}>CyberLab Security</strong> ("Company") and{" "}
                          <strong style={{ color: "#fff" }}>{employee.name}</strong> ("{empType}").
                        </p>
                        {(doc.bodyText || "").split("\n\n").map((para: string, i: number) => (
                          <p key={i} style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{para}</p>
                        ))}
                      </div>

                      {/* Signature form */}
                      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: "16px 20px" }}>
                        {/* Checkbox */}
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 16 }}>
                          <div style={{ position: "relative", marginTop: 2, flexShrink: 0 }}>
                            <input type="checkbox" className="peer sr-only" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                            <div className="w-5 h-5 rounded-md border-2 border-gray-600 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 flex items-center justify-center transition-all duration-200">
                              <Check size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <span style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>
                            I, <strong style={{ color: "#fff" }}>{employee.name}</strong>, have read and fully understand this document and agree to be legally bound by its terms.
                          </span>
                        </label>

                        {/* Signature input */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                            Digital Signature — Type Your Full Name
                          </label>
                          <input
                            type="text"
                            className="ob-sig-input"
                            placeholder="e.g. John Ahmad Khan"
                            value={signerName}
                            onChange={e => setSignerName(e.target.value)}
                          />
                          <p style={{ fontSize: 11, color: "#374151", marginTop: 6 }}>This serves as your legally binding electronic signature.</p>
                        </div>

                        {/* Sign button */}
                        <button
                          onClick={() => handleSign(doc)}
                          disabled={!canSign || isSigning}
                          className="ob-sign-btn"
                        >
                          {isSigning ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><FileSignature size={16} /> Sign & Accept Document</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );


      case "complete":
        return (
          <div className="ob-step-fade text-center py-8 sm:py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(52,211,153,0.4)]">
              <Check size={48} className="text-white" />
            </div>
            <h1 className="ob-hero-title">Initialization Complete</h1>
            <p className="ob-subtitle">Your secure workspace has been provisioned. Click below to enter the CyberLabSec operational portal and begin your mission.</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        body { margin: 0; background: #060509; font-family: 'Inter', system-ui, -apple-system, sans-serif; overflow-x: hidden; }

        .ob-grid {
          position: fixed; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none; z-index: 0;
          mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
        }
        .ob-blob1 {
          position: fixed; top: -200px; right: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .ob-blob2 {
          position: fixed; bottom: -200px; left: -200px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .ob-step-fade { animation: ob-fade 0.35s ease-out; }
        @keyframes ob-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .ob-hero-title {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 900; color: #fff;
          letter-spacing: -0.03em; margin-bottom: 16px; line-height: 1.15;
        }
        .ob-gradient-text {
          background: linear-gradient(135deg, #818CF8, #A855F7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .ob-subtitle { color: #9ca3af; font-size: 16px; line-height: 1.7; max-width: 560px; margin: 0 auto; }
        .ob-pill {
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
          color: #a5b4fc; font-size: 12px; font-weight: 600; padding: 5px 12px;
          border-radius: 20px;
        }

        .ob-section-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 22px; font-weight: 800; color: #fff;
          margin-bottom: 24px;
        }
        .ob-icon-purple { color: #8b5cf6; }
        .ob-icon-blue { color: #60a5fa; }
        .ob-icon-amber { color: #f59e0b; }

        .ob-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: clamp(20px, 4vw, 32px);
          backdrop-filter: blur(12px);
        }
        .ob-card-hover { transition: background 0.2s, border-color 0.2s; }
        .ob-card-hover:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }

        .ob-avatar {
          width: 64px; height: 64px; border-radius: 16px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 900; color: #fff;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        }

        .ob-icon-box {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .ob-icon-blue { background: rgba(96,165,250,0.15); color: #60a5fa; }
        .ob-icon-purple { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .ob-icon-amber { background: rgba(245,158,11,0.15); color: #f59e0b; }

        .ob-tour-tab {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 12px;
          border: 1px solid transparent; cursor: pointer;
          background: transparent; color: #6b7280;
          transition: all 0.2s; text-align: left; flex-shrink: 0;
          min-width: 120px;
        }
        .ob-tour-tab:hover { background: rgba(255,255,255,0.05); color: #d1d5db; border-color: rgba(255,255,255,0.08); }
        .ob-tour-tab-active { background: rgba(99,102,241,0.15) !important; color: #a5b4fc !important; border-color: rgba(99,102,241,0.3) !important; }
        .ob-tour-tab-icon { display: flex; align-items: center; color: #4b5563; }
        .ob-tour-tab-icon-active { color: #818cf8 !important; }
        .ob-tour-content { min-height: 220px; }

        .ob-rule-card {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 16px 20px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          transition: background 0.2s;
        }
        .ob-rule-card:hover { background: rgba(255,255,255,0.06); }
        .ob-rule-icon { font-size: 22px; line-height: 1; flex-shrink: 0; margin-top: 2px; }
        .ob-rule-red { border-left: 3px solid rgba(239,68,68,0.4); }
        .ob-rule-amber { border-left: 3px solid rgba(245,158,11,0.4); }
        .ob-rule-blue { border-left: 3px solid rgba(59,130,246,0.4); }
        .ob-rule-green { border-left: 3px solid rgba(34,197,94,0.4); }

        .ob-offer-card {
          background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2);
          border-radius: 16px; padding: 16px 20px;
          transition: background 0.2s;
        }
        .ob-offer-card:hover { background: rgba(245,158,11,0.1); }

        .ob-doc-card {
          border-radius: 20px; border: 1px solid;
          overflow: hidden; transition: all 0.3s;
        }
        .ob-doc-pending { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); }
        .ob-doc-pending:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }
        .ob-doc-signed { background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.25); }

        .ob-badge-signed {
          font-size: 10px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 20px;
          background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);
        }
        .ob-badge-pending {
          font-size: 10px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 20px;
          background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.25);
        }

        .ob-doc-body {
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 20px; max-height: 350px;
          overflow-y: auto;
        }
        .ob-sig-input {
          width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 12px 16px; color: #fff;
          font-size: 18px; font-family: 'Georgia', serif; font-style: italic;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .ob-sig-input:focus { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .ob-sig-input::placeholder { color: #4b5563; font-style: italic; }

        .ob-sign-btn {
          width: 100%; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          border: none; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }
        .ob-sign-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 25px rgba(99,102,241,0.4); filter: brightness(1.1); }
        .ob-sign-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .ob-sign-btn-mini {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          border: 1px solid rgba(99,102,241,0.35); color: #a5b4fc;
          font-size: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .ob-sign-btn-mini:hover { background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.35)); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,0.3); }

        .ob-all-signed {
          text-align: center; padding: 32px;
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25);
          border-radius: 20px; position: relative; overflow: hidden;
          box-shadow: 0 0 40px rgba(16,185,129,0.1);
        }

        .ob-btn-secondary {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 8px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: #9ca3af; font-size: 12px; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: all 0.15s;
        }
        .ob-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #d1d5db; }
        .ob-btn-sm { padding: 4px 10px; font-size: 11px; }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .ob-progress-bar {
          height: 3px; flex: 1; border-radius: 10px;
          background: rgba(255,255,255,0.07); overflow: hidden;
        }
        .ob-progress-fill {
          height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 10px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ob-main-card {
          background: rgba(8,7,14,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px; flex: 1;
          display: flex; flex-direction: column;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.6);
          overflow: hidden; position: relative;
        }
        .ob-main-card::before {
          content: '';
          position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent);
        }
        .ob-nav-btn-back {
          padding: 10px 20px; border-radius: 12px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: #6b7280; font-weight: 600; font-size: 14px; cursor: pointer;
          transition: all 0.2s;
        }
        .ob-nav-btn-back:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #9ca3af; }
        .ob-nav-btn-back:disabled { opacity: 0; pointer-events: none; }
        .ob-nav-btn-next {
          padding: 10px 28px; border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none; color: #fff; font-weight: 700; font-size: 14px;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: all 0.2s; box-shadow: 0 4px 18px rgba(99,102,241,0.3);
        }
        .ob-nav-btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,0.4); filter: brightness(1.08); }
        .ob-nav-btn-next:disabled { opacity: 0.5; filter: grayscale(1); cursor: not-allowed; box-shadow: none; }
        .ob-nav-btn-complete {
          padding: 10px 28px; border-radius: 12px;
          background: #fff; border: none; color: #111;
          font-weight: 800; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.2s; box-shadow: 0 4px 18px rgba(255,255,255,0.15);
        }
        .ob-nav-btn-complete:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(255,255,255,0.2); }
        .ob-nav-btn-complete:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      `}</style>

      <div className="ob-grid" />
      <div className="ob-blob1" />
      <div className="ob-blob2" />

      <div className="relative z-10 h-[100dvh] w-full flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-4xl flex flex-col h-[95%] max-h-[850px] gap-3 sm:gap-4">

          {/* Step Indicator */}
          <div style={{ padding: "0 8px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {STEPS.map((_, idx) => (
                <div key={idx} className="ob-progress-bar">
                  <div className="ob-progress-fill" style={{ width: idx <= currentStep ? "100%" : "0%" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600 }}>
                Step {currentStep + 1} of {STEPS.length} — <span style={{ color: "#9ca3af" }}>{STEPS[currentStep].title}</span>
              </p>
              <p style={{ color: "#4b5563", fontSize: "11px" }}>
                {STEPS[currentStep].icon}
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="ob-main-card">
            <div className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar">
              {renderContent()}
            </div>

            {/* Bottom Navigation */}
            <div style={{
              padding: "20px 28px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <button className="ob-nav-btn-back" onClick={handleBack} disabled={currentStep === 0 || loading}>
                ← Back
              </button>

              {currentStep === STEPS.length - 1 ? (
                <button className="ob-nav-btn-complete" onClick={completeOnboarding} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                  {loading ? "Initializing..." : "Enter Portal"}
                </button>
              ) : STEPS[currentStep].id === "portal" ? (
                <button 
                  className="ob-nav-btn-next" 
                  onClick={() => {
                    if (activeTourTab < PORTAL_TABS.length - 1) {
                      const nextTab = activeTourTab + 1;
                      setActiveTourTab(nextTab);
                      if (!exploredTabs.has(nextTab)) {
                        setExploredTabs(prev => new Set(prev).add(nextTab));
                        confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, zIndex: 9999, colors: ['#6366f1', '#a855f7', '#3b82f6'] });
                      }
                    } else {
                      handleNext();
                    }
                  }}
                >
                  {activeTourTab < PORTAL_TABS.length - 1 ? `Explore ${PORTAL_TABS[activeTourTab + 1].title}` : "Next"} <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  className="ob-nav-btn-next" 
                  onClick={handleNext}
                >
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
