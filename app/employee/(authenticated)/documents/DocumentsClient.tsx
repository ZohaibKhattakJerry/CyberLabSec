"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Shield, FileText, Download, Award, Briefcase, FileSignature, Lock, Clock, CheckCircle2, AlertCircle, Send, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

type DocumentStatus = "Available" | "Pending Consent" | "Accepted" | "Pending" | "Requested" | "Locked";

export default function DocumentsClient({ 
  employee, 
  dbDocs, 
  isCompleted, 
  empType 
}: { 
  employee: any; 
  dbDocs: any[]; 
  isCompleted: boolean; 
  empType: string; 
}) {
  const router = useRouter();
  const [loadingReq, setLoadingReq] = useState<string | null>(null);

  const getDoc = (title: string) => dbDocs.find(d => d.title === title);
  const getDocUrl = (title: string) => getDoc(title)?.fileUrl || null;
  const getDocStatus = (title: string) => getDoc(title)?.status || "Pending";

  const handleRequest = async (title: string) => {
    setLoadingReq(title);
    try {
      const res = await fetch("/api/employee/documents/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request");
      
      if (title === "Performance Review") {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 });
        toast.success("Performance Review Requested! An admin will review it shortly.", { icon: "🎉" });
      } else {
        toast.success(`${title} requested successfully`);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingReq(null);
    }
  };

  const handleAccept = async (title: string) => {
    setLoadingReq(title);
    try {
      const res = await fetch("/api/employee/documents/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept");
      
      toast.success(`${title} accepted successfully`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingReq(null);
    }
  };

  // Section 1: Pre-Joining Documents (Only show if they exist in dbDocs)
  const preJoiningDocs = dbDocs.filter(d => 
    ["Job Offer Letter", "Internship Offer Letter", "Contract Offer Letter", "Offer Letter", "Employment Contract", "Internship Agreement", "Fixed-Term Agreement", "Resume / CV", "ID Card / CNIC"].includes(d.title)
  ).map(d => ({
    label: d.title,
    desc: "Generated during application/hiring process",
    icon: "📄",
    status: d.status as DocumentStatus,
    url: d.fileUrl,
    canRequest: false
  }));

  // Section 2: Onboarding Consents
  const consentDocsRaw = [
    { label: "NDA", desc: "Non-Disclosure Agreement" },
    { label: "Code of Conduct Acceptance", desc: "Company Code of Conduct" },
    ...(empType === "Employee" || empType === "Full-Time" ? [{ label: "Employee Handbook Acknowledgment", desc: "Company policies acknowledgment" }] : [])
  ];

  const onboardingConsents = consentDocsRaw.map(d => {
    const doc = getDoc(d.label);
    return {
      ...d,
      icon: "📋",
      status: (doc?.status || "Pending Consent") as DocumentStatus,
      url: doc?.fileUrl,
      canRequest: false
    };
  });

  // Section 3: During Tenure
  const duringTenureDocs = [
    { label: "Confirmation Letter", desc: "Official confirmation of employment", icon: "✅", canRequest: !getDocUrl("Confirmation Letter") && getDocStatus("Confirmation Letter") !== "Requested", for: ["Employee", "Full-Time"] },
    { label: "Performance Review", desc: "Request an AI performance evaluation", icon: "📊", canRequest: !getDocUrl("Performance Review") && getDocStatus("Performance Review") !== "Requested", for: ["Intern", "Employee", "Full-Time", "Contract"] },
    { label: "Appreciation Letter", desc: "Recognition and appreciation", icon: "🌟", canRequest: !getDocUrl("Appreciation Letter") && getDocStatus("Appreciation Letter") !== "Requested", for: ["Intern", "Employee", "Full-Time", "Contract"] },
    { label: "Contract Extension Letter", desc: "Contract extension approval", icon: "📅", canRequest: false, for: ["Contract"] },
    { label: "Warning Letter", desc: "Disciplinary action records", icon: "⚠️", canRequest: false, for: ["Intern", "Employee", "Full-Time", "Contract"] },
    { label: "Training Certificate", desc: "Corporate training completion", icon: "🎓", canRequest: false, for: ["Employee", "Full-Time"] }
  ].filter(d => d.for.includes(empType)).map(d => ({
    ...d,
    status: (getDocUrl(d.label) ? "Available" : getDocStatus(d.label)) as DocumentStatus,
    url: getDocUrl(d.label)
  }));

  // Section 4: Exit & Completion
  const exitDocs = [
    { label: "Internship Completion Certificate", desc: "Official completion certificate", icon: "🎓", for: ["Intern"] },
    { label: "Recommendation Letter", desc: "Letter of recommendation", icon: "👍", for: ["Intern"] },
    { label: "Acceptance Letter", desc: "Resignation Acceptance Letter", icon: "🤝", for: ["Employee", "Full-Time"] },
    { label: "Experience Letter", desc: "Official experience certificate", icon: "📜", for: ["Employee", "Full-Time", "Contract", "Intern"] },
    { label: "No Due Certificate", desc: "Clearance certificate", icon: "💸", for: ["Employee", "Full-Time"] },
    { label: "Contract Completion Certificate", desc: "Project completion certificate", icon: "🎓", for: ["Contract"] },
    { label: "Contract End Letter", desc: "Official end of contract", icon: "🛑", for: ["Contract"] },
    { label: "Full & Final Settlement", desc: "F&F clearance", icon: "💰", for: ["Employee", "Full-Time", "Contract"] },
  ].filter(d => d.for.includes(empType)).map(d => ({
    ...d,
    status: (isCompleted ? (getDocUrl(d.label) ? "Available" : getDocStatus(d.label)) : "Locked") as DocumentStatus,
    url: getDocUrl(d.label),
    canRequest: isCompleted && !getDocUrl(d.label) && getDocStatus(d.label) !== "Requested"
  }));

  const renderCard = (doc: any, sectionType: string) => (
    <div key={doc.label} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border transition-all" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--border-subtle)" }}>
      <div className="flex gap-4 items-center w-full">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.1)", color: "var(--brand-primary)", fontSize: "20px" }}>
          {doc.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px] text-white truncate">{doc.label}</span>
            {doc.status === "Available" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Available</span>}
            {doc.status === "Accepted" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">Accepted</span>}
            {doc.status === "Pending Consent" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Action Required</span>}
            {doc.status === "Requested" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">Requested</span>}
            {doc.status === "Locked" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1"><Lock size={10} /> Locked</span>}
          </div>
          <p className="text-[13px] text-gray-400 mt-1 truncate">{doc.desc}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 sm:mt-0 ml-14 sm:ml-0 shrink-0">
        {doc.url ? (
          <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm flex items-center gap-1.5 h-8 px-3 text-[13px]">
            <Download size={14} /> View
          </a>
        ) : null}

        {doc.status === "Pending Consent" && (
          <button 
            onClick={() => handleAccept(doc.label)}
            disabled={loadingReq === doc.label}
            className="btn btn-primary btn-sm flex items-center gap-1.5 h-8 px-3 text-[13px] bg-brand-primary"
          >
            {loadingReq === doc.label ? <Loader2 size={14} className="spin" /> : <Check size={14} />} 
            Accept
          </button>
        )}

        {doc.canRequest && (
          <button 
            onClick={() => handleRequest(doc.label)}
            disabled={loadingReq === doc.label}
            className="btn btn-primary btn-sm flex items-center gap-1.5 h-8 px-3 text-[13px]"
          >
            {loadingReq === doc.label ? <Loader2 size={14} className="spin" /> : <Send size={14} />} 
            Request
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[rgba(168,85,247,0.1)] to-transparent border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <FileSignature size={150} />
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
            <FileText size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Documents</h1>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed max-w-2xl">
              Access your official employment documents, acknowledge company policies, and request administrative files seamlessly.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Pre-Joining Section */}
        {preJoiningDocs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase size={18} className="text-brand-primary" /> Pre-Joining Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preJoiningDocs.map(d => renderCard(d, "PreJoining"))}
            </div>
          </section>
        )}

        {/* Onboarding Consents Section */}
        {onboardingConsents.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield size={18} className="text-orange-400" /> Onboarding & Consents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onboardingConsents.map(d => renderCard(d, "Consent"))}
            </div>
          </section>
        )}

        {/* During Tenure Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock size={18} className="text-blue-400" /> During Tenure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duringTenureDocs.map(d => renderCard(d, "During"))}
          </div>
        </section>

        {/* Completion & Exit Section */}
        <section className="space-y-4 opacity-90">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award size={18} className="text-green-400" /> Completion & Exit Documents
            </h2>
            {!isCompleted && (
              <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400 flex items-center gap-1.5">
                <Lock size={12} /> Unlocks upon completion
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exitDocs.map(d => renderCard(d, "Exit"))}
          </div>
        </section>
      </div>
    </div>
  );
}
