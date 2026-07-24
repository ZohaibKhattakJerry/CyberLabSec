"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  Shield, FileText, Download, Award, Briefcase, FileSignature, Lock,
  CheckCircle2, AlertCircle, Send, Loader2, Check, X, UploadCloud, Clock,
  Star, Flag, Sparkles, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";

// Helper to view Base64 correctly in a new tab
const handleViewBase64 = (url: string, title: string) => {
  if (url.startsWith("data:")) {
    const arr = url.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    // Optionally revoke after a short delay since opening might take a moment
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } else {
    // Normal URL
    window.open(url, '_blank');
  }
};

// ─── Types ─────────────────────────────────────────────────────────────────
type DocStatus = "pending_signature" | "signed" | "uploaded" | "requested" | "locked" | "issued" | "responded" | "not_available";

interface DocDefinition {
  key: string;           // unique key matching document title
  label: string;
  desc: string;
  phase: "pre" | "onboarding" | "during" | "exit";
  action?: "download_only" | "sign" | "request" | "view_warning";
}

// ─── Status Badge Config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DocStatus, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  pending_signature: { label: "Pending Signature", emoji: "🟡", bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  signed:           { label: "Signed",             emoji: "🟢", bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.3)" },
  uploaded:         { label: "Uploaded",            emoji: "📤", bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  requested:        { label: "Requested",           emoji: "📥", bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.3)" },
  locked:           { label: "Locked",              emoji: "🔒", bg: "rgba(107,114,128,0.1)",  text: "#6b7280", border: "rgba(107,114,128,0.2)" },
  issued:           { label: "Issued",              emoji: "✅", bg: "rgba(34,197,94,0.12)",  text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  responded:        { label: "Responded",           emoji: "💬", bg: "rgba(99,102,241,0.12)", text: "#818cf8", border: "rgba(99,102,241,0.3)" },
  not_available:    { label: "Not Available",       emoji: "—",  bg: "rgba(75,85,99,0.1)",   text: "#4b5563", border: "rgba(75,85,99,0.2)" },
};

// ─── Document definitions per employment type ───────────────────────────────
function getDocDefs(empType: string): DocDefinition[] {
  const isIntern = empType === "Intern";

  const preDocs: DocDefinition[] = [
    { key: "Offer Letter",       label: "Offer Letter",       desc: "Generated upon hire and emailed to you", phase: "pre", action: "download_only" },
    ...(isIntern ? [
      { key: "Internship Agreement", label: "Internship Agreement", desc: "Formal internship engagement agreement", phase: "pre" as const, action: "sign" as const },
    ] : [
      { key: "Employment Contract",  label: "Employment Contract",  desc: "Formal employment engagement contract",  phase: "pre" as const, action: "sign" as const },
    ]),
    { key: "NDA",                label: "NDA",                desc: "Non-Disclosure Agreement",              phase: "pre", action: "sign" },
    { key: "Code of Conduct",    label: "Code of Conduct",    desc: "Company code of conduct policy",         phase: "pre", action: "sign" },
  ];

  const duringDocs: DocDefinition[] = isIntern ? [
    { key: "Training Certificate",  label: "Training Certificate",  desc: "Corporate training completion certificate", phase: "during", action: "request" },
    { key: "Performance Review",    label: "Performance Review",    desc: "Request an AI performance evaluation",       phase: "during", action: "request" },
    { key: "Appreciation Letter",   label: "Appreciation Letter",   desc: "Recognition for outstanding work",           phase: "during", action: "request" },
    { key: "Warning Letter",        label: "Warning Letter",        desc: "Issued by company for disciplinary matters",  phase: "during", action: "view_warning" },
  ] : [
    { key: "Confirmation Letter",   label: "Confirmation Letter",   desc: "Confirms your official employment status",    phase: "during", action: "request" },
    { key: "Training Certificate",  label: "Training Certificate",  desc: "Corporate training completion certificate",   phase: "during", action: "request" },
    { key: "Warning Letter",        label: "Warning Letter",        desc: "Issued by company for disciplinary matters",   phase: "during", action: "view_warning" },
  ];

  const exitDocs: DocDefinition[] = isIntern ? [
    { key: "Internship Completion Certificate", label: "Internship Completion Certificate", desc: "Official completion certificate",  phase: "exit", action: "request" },
    { key: "Recommendation Letter",             label: "Recommendation Letter",             desc: "Letter of recommendation",          phase: "exit", action: "request" },
    { key: "No Due Certificate",                label: "No Due Certificate",                desc: "Clearance and no-dues certificate", phase: "exit", action: "request" },
    { key: "Full & Final Settlement",           label: "Full & Final Settlement",           desc: "Final settlement clearance",         phase: "exit", action: "request" },
  ] : [
    { key: "Experience Letter",      label: "Experience Letter",      desc: "Official experience certificate",           phase: "exit", action: "request" },
    { key: "Relieving Letter",       label: "Relieving Letter",       desc: "Formal relieving letter",                   phase: "exit", action: "request" },
    { key: "No Due Certificate",     label: "No Due Certificate",     desc: "Clearance and no-dues certificate",         phase: "exit", action: "request" },
    { key: "Full & Final Settlement",label: "Full & Final Settlement",desc: "Final settlement clearance",                phase: "exit", action: "request" },
  ];

  return [...preDocs, ...duringDocs, ...exitDocs];
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function DocumentsClient({
  employee,
  dbDocs,
  signatures,
  isCompleted,
  empType,
}: {
  employee: any;
  dbDocs: any[];
  signatures: any[];
  isCompleted: boolean;
  empType: string;
}) {
  const router = useRouter();
  const [loadingReq, setLoadingReq] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "Warning Letter Response", base64: "", fileName: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDefs = getDocDefs(empType);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const findDbDoc = (key: string) => dbDocs.find(d =>
    d.title === key ||
    (key === "Offer Letter" && ["Job Offer Letter", "Internship Offer Letter", "Initial Offer Letter", "Contract Offer Letter", "Offer Letter"].some(t => d.title?.includes(t)))
  );

  const findSig = (key: string) => signatures.find(s => {
    const title = s.document?.title || s.title || "";
    if (key === "Employment Contract") return title.includes("Employment Contract") || title.includes("Internship Agreement");
    return title === key || title.includes(key);
  });

  const getStatus = (def: DocDefinition): DocStatus => {
    if (def.phase === "exit" && !isCompleted) return "locked";

    if (def.action === "sign") {
      const sig = findSig(def.key);
      return sig ? "signed" : "pending_signature";
    }

    if (def.action === "download_only") {
      const db = findDbDoc(def.key);
      return db?.fileUrl ? "issued" : "not_available";
    }

    if (def.action === "view_warning") {
      const db = findDbDoc(def.key);
      if (!db) return "not_available";
      const hasResponse = !!findDbDoc("Warning Letter Response");
      if (hasResponse) return "responded";
      return db.fileUrl ? "uploaded" : "not_available";
    }

    // request type
    const db = findDbDoc(def.key);
    if (!db) return "not_available";
    if (db.fileUrl || db.status === "Approved") return "issued";
    if (db.status === "Requested") return "requested";
    return "not_available";
  };

  const getFileUrl = (def: DocDefinition): string | null => {
    if (def.action === "sign") return findSig(def.key)?.pdfFileUrl || null;
    return findDbDoc(def.key)?.fileUrl || null;
  };

  // ── Request Handler ───────────────────────────────────────────────────────
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
      toast.success(`${title} requested successfully!`);
      if (title === "Performance Review") confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingReq(null);
    }
  };

  // ── Upload Warning Response ───────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadForm(f => ({ ...f, fileName: file.name }));
    const reader = new FileReader();
    reader.onload = () => setUploadForm(f => ({ ...f, base64: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.base64) return toast.error("File required");
    setUploading(true);
    try {
      const res = await fetch("/api/employee/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: uploadForm.title, type: "During", fileUrl: uploadForm.base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShowUploadModal(false);
      setUploadForm({ title: "Warning Letter Response", base64: "", fileName: "" });
      toast.success("Response uploaded!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Phase Summary ─────────────────────────────────────────────────────────
  const signedCount = allDefs.filter(d => getStatus(d) === "signed").length;
  const issuedCount = allDefs.filter(d => ["issued", "signed", "uploaded"].includes(getStatus(d))).length;
  const totalDocs = allDefs.length;

  // ── Doc Card Render ───────────────────────────────────────────────────────
  const renderDocCard = (def: DocDefinition) => {
    const status = getStatus(def);
    const fileUrl = getFileUrl(def);
    const statusCfg = STATUS_CONFIG[status];

    const canRequest = def.action === "request" && status === "not_available" && (def.phase !== "exit" || isCompleted);
    const canUploadWarningResponse = def.action === "view_warning" && status === "uploaded" && !findDbDoc("Warning Letter Response");

    return (
      <div key={def.key} className="doc-card group">
        {/* Icon + Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="doc-icon-box">
            {status === "signed" ? <CheckCircle2 size={20} className="text-emerald-400" /> :
             status === "locked" ? <Lock size={20} className="text-gray-600" /> :
             status === "issued" ? <CheckCircle2 size={20} className="text-green-400" /> :
             status === "uploaded" ? <FileText size={20} className="text-blue-400" /> :
             status === "responded" ? <CheckCircle2 size={20} className="text-indigo-400" /> :
             def.action === "sign" ? <FileSignature size={20} className="text-purple-400" /> :
             <FileText size={20} className="text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-white text-[15px] leading-tight">{def.label}</span>
              {/* Status Badge */}
              <span className="doc-badge" style={{ background: statusCfg.bg, color: statusCfg.text, borderColor: statusCfg.border }}>
                {statusCfg.emoji} {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{def.desc}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-3 sm:mt-0">
          {fileUrl && (
            <button onClick={() => handleViewBase64(fileUrl, (def as any).title)} className="doc-btn doc-btn-secondary">
              <Eye size={13} /> View
            </button>
          )}
          {canRequest && (
            <button
              onClick={() => handleRequest(def.key)}
              disabled={loadingReq === def.key}
              className="doc-btn doc-btn-primary"
            >
              {loadingReq === def.key ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Request
            </button>
          )}
          {canUploadWarningResponse && (
            <button onClick={() => setShowUploadModal(true)} className="doc-btn doc-btn-primary">
              <UploadCloud size={13} /> Respond
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Section Renderer ──────────────────────────────────────────────────────
  const renderSection = (phase: "pre" | "during" | "exit", title: string, icon: React.ReactNode, color: string) => {
    const docs = allDefs.filter(d => d.phase === phase);
    const completedInSection = docs.filter(d => ["signed", "issued", "uploaded", "responded"].includes(getStatus(d))).length;

    return (
      <section className="doc-section">
        <div className="doc-section-header">
          <div className="flex items-center gap-3">
            <div className="doc-section-icon" style={{ background: `${color}15`, color }}>
              {icon}
            </div>
            <div>
              <h2 className="doc-section-title">{title}</h2>
              <p className="doc-section-sub">{completedInSection}/{docs.length} documents available</p>
            </div>
          </div>
          {phase === "exit" && !isCompleted && (
            <span className="doc-lock-badge">
              <Lock size={11} /> Unlocks upon tenure completion
            </span>
          )}
        </div>
        <div className="doc-cards-list">
          {docs.map(def => renderDocCard(def))}
        </div>
      </section>
    );
  };

  // ── Extra/Other docs (anything not in definitions) ───────────────────────
  const knownKeys = allDefs.map(d => d.key);
  const otherDocs = dbDocs.filter(d => !knownKeys.some(k =>
    d.title === k || d.title?.includes(k) || k === "Offer Letter" && d.title?.includes("Offer")
  ) && d.fileUrl && !d.title?.includes("Warning Letter Response"));

  return (
    <>
      <style>{`
        .doc-page { max-width: 900px; margin: 0 auto; padding: 0 0 64px; }

        .doc-header-card {
          background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.04) 100%);
          border: 1px solid rgba(99,102,241,0.2); border-radius: 20px;
          padding: clamp(20px, 4vw, 28px); position: relative; overflow: hidden;
          margin-bottom: 36px;
        }
        .doc-header-bg-icon {
          position: absolute; right: -20px; top: -20px;
          opacity: 0.04; pointer-events: none;
        }

        .doc-stat-row { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
        .doc-stat {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700;
        }

        .doc-section { margin-bottom: 40px; }
        .doc-section-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
        }
        .doc-section-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .doc-section-title { font-size: 17px; font-weight: 800; color: #fff; }
        .doc-section-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .doc-lock-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; color: #6b7280;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          padding: 5px 12px; border-radius: 20px;
        }

        .doc-cards-list { display: flex; flex-direction: column; gap: 10px; }

        .doc-card {
          display: flex; align-items: flex-start;
          flex-direction: column; gap: 0;
          padding: 16px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          transition: background 0.2s, border-color 0.2s;
        }
        @media (min-width: 640px) {
          .doc-card { flex-direction: row; align-items: center; }
        }
        .doc-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); }

        .doc-icon-box {
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background 0.2s;
        }
        .doc-card:hover .doc-icon-box { background: rgba(99,102,241,0.12); }

        .doc-badge {
          font-size: 10px; font-weight: 800; letter-spacing: 0.04em;
          padding: 3px 9px; border-radius: 20px; border: 1px solid;
          white-space: nowrap;
        }

        .doc-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid; text-decoration: none;
          transition: all 0.15s; white-space: nowrap;
        }
        .doc-btn-secondary {
          background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #9ca3af;
        }
        .doc-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #d1d5db; }
        .doc-btn-primary {
          background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #a5b4fc;
        }
        .doc-btn-primary:hover { background: rgba(99,102,241,0.25); }
        .doc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .doc-upload-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .doc-upload-modal {
          background: #0e0d16; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 32px; max-width: 460px; width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .doc-upload-dropzone {
          border: 2px dashed; border-radius: 14px; padding: 28px 20px;
          text-align: center; cursor: pointer; transition: all 0.2s;
        }
      `}</style>

      <div className="doc-page space-y-0">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="doc-header-card">
          <div className="doc-header-bg-icon"><FileSignature size={180} /></div>
          <div className="flex items-start gap-4">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={24} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "clamp(18px,4vw,22px)", fontWeight: 800, color: "#fff", marginBottom: 6 }}>My Documents</h1>
              <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, maxWidth: 560 }}>
                Access your official employment documents — from pre-joining consents to tenure certificates.
                Request admin-issued documents directly from here.
              </p>
              <div className="doc-stat-row">
                <span className="doc-stat" style={{ color: "#34d399" }}><CheckCircle2 size={12} /> {issuedCount} Available</span>
                <span className="doc-stat" style={{ color: "#818cf8" }}><FileText size={12} /> {totalDocs} Total Documents</span>
                <span className="doc-stat" style={{ color: "#f59e0b" }}><Star size={12} /> {empType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pre-Joining (includes Offer Letter + signed onboarding docs) ── */}
        {renderSection("pre", "Pre-Joining Documents", <Shield size={18} />, "#8b5cf6")}

        {/* ── During Tenure ───────────────────────────────────────────────── */}
        {renderSection("during", "During Tenure", <Clock size={18} />, "#60a5fa")}

        {/* ── Completion & Exit ─────────────────────────────────────────── */}
        {renderSection("exit", "Completion & Exit", <Award size={18} />, "#34d399")}

        {/* ── Other Docs ─────────────────────────────────────────────────── */}
        {otherDocs.length > 0 && (
          <section className="doc-section">
            <div className="doc-section-header">
              <div className="flex items-center gap-3">
                <div className="doc-section-icon" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <h2 className="doc-section-title">Other Documents</h2>
                  <p className="doc-section-sub">Additional files on your profile</p>
                </div>
              </div>
            </div>
            <div className="doc-cards-list">
              {otherDocs.map(doc => (
                <div key={doc.id} className="doc-card group">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="doc-icon-box"><FileText size={20} className="text-gray-500" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-[15px]">{doc.title}</span>
                        <span className="doc-badge" style={{ background: STATUS_CONFIG.issued.bg, color: STATUS_CONFIG.issued.text, borderColor: STATUS_CONFIG.issued.border }}>
                          {STATUS_CONFIG.issued.emoji} {STATUS_CONFIG.issued.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Type: {doc.type}</p>
                    </div>
                  </div>
                  {doc.fileUrl && (
                    <button onClick={() => handleViewBase64(doc.fileUrl, doc.title)} className="doc-btn doc-btn-secondary mt-3 sm:mt-0">
                      <Eye size={13} /> View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Upload Warning Response Modal ────────────────────────────────── */}
      {showUploadModal && (
        <div className="doc-upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="doc-upload-modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UploadCloud size={20} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>Upload Response</h2>
                  <p style={{ fontSize: 12, color: "#6b7280" }}>For: Warning Letter</p>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px", color: "#9ca3af", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} style={{ display: "grid", gap: 16 }}>
              <div
                className="doc-upload-dropzone"
                style={{ borderColor: uploadForm.base64 ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)", background: uploadForm.base64 ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)" }}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadForm.base64 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#34d399" }}>
                    <CheckCircle2 size={16} /><span style={{ fontSize: 13, fontWeight: 600 }}>{uploadForm.fileName}</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={28} style={{ margin: "0 auto 8px", color: "#4b5563" }} />
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Click to select file</div>
                    <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>PDF, PNG, JPG up to 10MB</div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} accept="application/pdf,image/*" onChange={handleFileUpload} />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="doc-btn doc-btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" disabled={uploading || !uploadForm.base64} className="doc-btn doc-btn-primary" style={{ flex: 1, justifyContent: "center", background: "rgba(99,102,241,0.2)", borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", height: 40, fontSize: 13 }}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  {uploading ? "Uploading..." : "Submit Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
