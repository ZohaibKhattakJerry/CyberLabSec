"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  FileText, Download, UploadCloud, Loader2, ArrowLeft, Trash2,
  Shield, Award, Briefcase, CheckCircle2,
  Clock, User, Mail, Badge, Building2, Lock, Star, Check, FileSignature, AlertCircle, Eye
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────
// Helper to view Base64 correctly in a new tab (Chrome blocks data URLs on target=_blank)
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
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } else {
    // Normal URL
    window.open(url, '_blank');
  }
};
type DocSection = "pre" | "onboarding" | "during" | "exit" | "other";

interface DocSlot {
  title: string;
  desc: string;
  icon: string;
  section: DocSection;
  isSignable?: boolean;
  isLocked?: boolean;
  isOptional?: boolean;
  isCompanyIssued?: boolean; // admin uploads, employee views
  isRequestable?: boolean;   // employee can request
}

// ─── Status config (matches employee portal) ───────────────────────────────
const STATUS_BADGES: Record<string, { label: string; emoji: string; bg: string; color: string; border: string }> = {
  "pending_signature": { label: "Pending Signature", emoji: "🟡", bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "signed":            { label: "Signed",             emoji: "🟢", bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.3)" },
  "uploaded":          { label: "Uploaded",            emoji: "📤", bg: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "requested":         { label: "Requested",           emoji: "📥", bg: "rgba(249,115,22,0.12)", color: "#fb923c", border: "rgba(249,115,22,0.3)" },
  "locked":            { label: "Locked",              emoji: "🔒", bg: "rgba(107,114,128,0.1)",  color: "#6b7280", border: "rgba(107,114,128,0.2)" },
  "issued":            { label: "Issued",              emoji: "✅", bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)" },
  "responded":         { label: "Responded",           emoji: "💬", bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.3)" },
  "not_uploaded":      { label: "Not Uploaded",        emoji: "—",  bg: "rgba(75,85,99,0.1)",   color: "#4b5563", border: "rgba(75,85,99,0.2)" },
};

// ─── Document Definitions by employee type ─────────────────────────────────
function getDocSlots(empType: string, isCompleted: boolean): DocSlot[] {
  const isIntern = empType === "Intern";
  const isContract = empType === "Contract";

  const preSlots: DocSlot[] = [
    { title: "Offer Letter", desc: "Emailed upon hire — uploaded by admin", icon: "📄", section: "pre", isCompanyIssued: true },
    ...(isIntern
      ? [{ title: "Internship Agreement", desc: "Formal internship engagement agreement — digitally signed", icon: "📋", section: "pre" as DocSection, isSignable: true }]
      : isContract
      ? [{ title: "Contract Agreement", desc: "Fixed-term contract agreement — digitally signed", icon: "📋", section: "pre" as DocSection, isSignable: true }]
      : [{ title: "Employment Contract", desc: "Formal employment contract — digitally signed", icon: "📋", section: "pre" as DocSection, isSignable: true }]
    ),
    { title: "NDA", desc: "Non-Disclosure Agreement — digitally signed", icon: "🔐", section: "pre", isSignable: true },
    { title: "Code of Conduct", desc: "Company code of conduct policy — digitally signed", icon: "📜", section: "pre", isSignable: true },
  ];

  const duringSlots: DocSlot[] = isIntern ? [
    { title: "Training Certificate",  desc: "Issued on corporate training completion",          icon: "🎓", section: "during", isCompanyIssued: true, isRequestable: true },
    { title: "Performance Review",    desc: "AI-evaluated performance report",                   icon: "📊", section: "during", isCompanyIssued: true, isRequestable: true, isOptional: true },
    { title: "Appreciation Letter",   desc: "Recognition for outstanding work",                  icon: "🌟", section: "during", isCompanyIssued: true, isRequestable: true, isOptional: true },
    { title: "Warning Letter",        desc: "Issued by company for disciplinary action",         icon: "⚠️", section: "during", isCompanyIssued: true },
  ] : isContract ? [
    { title: "Confirmation Letter",   desc: "Confirms official contract activation",              icon: "✅", section: "during", isCompanyIssued: true, isRequestable: true },
    { title: "Training Certificate",  desc: "Issued on corporate training completion",           icon: "🎓", section: "during", isCompanyIssued: true, isRequestable: true },
    { title: "Warning Letter",        desc: "Issued by company for disciplinary action",         icon: "⚠️", section: "during", isCompanyIssued: true },
  ] : [
    { title: "Confirmation Letter",   desc: "Confirms official employment status",               icon: "✅", section: "during", isCompanyIssued: true, isRequestable: true },
    { title: "Training Certificate",  desc: "Issued on corporate training completion",           icon: "🎓", section: "during", isCompanyIssued: true, isRequestable: true },
    { title: "Warning Letter",        desc: "Issued by company for disciplinary action",         icon: "⚠️", section: "during", isCompanyIssued: true },
  ];

  const exitSlots: DocSlot[] = isIntern ? [
    { title: "Internship Completion Certificate", desc: "Official internship completion certificate", icon: "🏆", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "Recommendation Letter",             desc: "Letter of recommendation",                   icon: "👍", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "No Due Certificate",                desc: "Clearance and no-dues certificate",           icon: "💸", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "Full & Final Settlement",           desc: "Final financial settlement clearance",         icon: "💰", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
  ] : isContract ? [
    { title: "Contract Completion Certificate",   desc: "Official contract completion certificate",     icon: "🏆", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "Experience Letter",                 desc: "Official experience certificate",              icon: "📜", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "No Due Certificate",                desc: "Clearance and no-dues certificate",            icon: "💸", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "Full & Final Settlement",           desc: "Final financial settlement clearance",          icon: "💰", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
  ] : [
    { title: "Experience Letter",      desc: "Official experience certificate",                   icon: "📜", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "Relieving Letter",       desc: "Formal relieving letter",                           icon: "🤝", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "No Due Certificate",     desc: "Clearance and no-dues certificate",                 icon: "💸", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
    { title: "Full & Final Settlement",desc: "Final financial settlement clearance",               icon: "💰", section: "exit", isCompanyIssued: true, isRequestable: true, isLocked: !isCompleted },
  ];

  return [...preSlots, ...duringSlots, ...exitSlots];
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function EmployeeDetailsClient({ employee }: { employee: any }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>(employee.documents || []);
  const [signatures] = useState<any[]>(employee.documentSignatures || []);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", type: "Other", base64: "", fileName: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const empType = employee.employmentType || "Employee";
  const isIntern = empType === "Intern";
  const isCompleted = employee.status === "Inactive" || employee.status === "Terminated";
  const offerVariants = ["Job Offer Letter", "Internship Offer Letter", "Initial Offer Letter", "Contract Offer Letter", "Offer Letter"];

  // ── Lookups ────────────────────────────────────────────────────────────────
  const findDoc = (title: string) => {
    if (title === "Offer Letter") {
      return documents.find(d => offerVariants.some(v => d.title?.includes(v)));
    }
    return documents.find(d => d.title === title);
  };

  const findSig = (title: string) =>
    signatures.find(s => {
      const t = s.document?.title || "";
      if (title === "Employment Contract") return t.includes("Employment Contract") || t.includes("Internship Agreement") || t.includes("Contract Agreement");
      return t === title || t.includes(title);
    });

  // ── Resolve status for a slot ───────────────────────────────────────────
  const resolveStatus = (slot: DocSlot): string => {
    if (slot.isLocked) return "locked";

    if (slot.isSignable) {
      const sig = findSig(slot.title);
      if (sig) return "signed";
      // Check EmployeeDocument too (backfilled)
      const doc = findDoc(slot.title);
      if (doc?.status === "Signed") return "signed";
      return "pending_signature";
    }

    const doc = findDoc(slot.title);
    if (!doc) return "not_uploaded";
    if (doc.status === "Requested") return "requested";
    if (doc.status === "Signed" || doc.status === "Accepted") return "signed";
    if (doc.fileUrl) return "issued";
    return "not_uploaded";
  };

  const getFileUrl = (slot: DocSlot): string | null => {
    if (slot.isSignable) return findSig(slot.title)?.pdfFileUrl || findDoc(slot.title)?.fileUrl || null;
    return findDoc(slot.title)?.fileUrl || null;
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleUploadSlot = (title: string) => {
    setUploadForm({ title, type: "Other", base64: "", fileName: "" });
    setShowUploadModal(true);
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;
    setDeleting(docId);
    try {
      const res = await fetch(`/api/company/employees/${employee.id}/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Document deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

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
    if (!uploadForm.base64 || !uploadForm.title) return toast.error("File and Title required");

    setUploading(true);
    try {
      const res = await fetch(`/api/company/employees/${employee.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: uploadForm.title, type: uploadForm.type, fileUrl: uploadForm.base64 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const newDoc = data.document;
      setDocuments(prev => {
        const idx = prev.findIndex(d => d.title === newDoc.title);
        if (idx > -1) {
          const arr = [...prev];
          arr[idx] = newDoc;
          return arr;
        }
        return [newDoc, ...prev];
      });

      setShowUploadModal(false);
      setUploadForm({ title: "", type: "Other", base64: "", fileName: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Document uploaded successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── Slot card ───────────────────────────────────────────────────────────
  const DocSlotCard = ({ slot }: { slot: DocSlot }) => {
    const status = resolveStatus(slot);
    const fileUrl = getFileUrl(slot);
    const badge = STATUS_BADGES[status] || STATUS_BADGES["not_uploaded"];
    const dbDoc = findDoc(slot.title);
    const canUpload = !slot.isSignable && !slot.isLocked && status !== "signed";

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, flexWrap: "wrap", transition: "background 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
      >
        {/* Icon */}
        <div style={{ width: 40, height: 40, borderRadius: 10, background: status === "signed" || status === "issued" ? "rgba(16,185,129,0.1)" : status === "pending_signature" ? "rgba(245,158,11,0.1)" : status === "locked" ? "rgba(107,114,128,0.06)" : "rgba(168,85,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          {slot.isLocked ? "🔒" : slot.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: slot.isLocked ? "#4b5563" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slot.title}</span>
            {slot.isOptional && <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", borderRadius: 20, padding: "1px 7px", letterSpacing: "0.05em" }}>OPTIONAL</span>}
            {/* Status Badge */}
            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0 }}>
              {badge.emoji} {badge.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#4b5563" }}>{slot.desc}</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {fileUrl ? (
            <>
              <button onClick={() => handleViewBase64(fileUrl, slot.title)} className="btn btn-secondary btn-sm" style={{ gap: 5 }}>
                <Eye size={13} /> View
              </button>
              {/* Allow re-upload for company-issued docs */}
              {canUpload && (
                <button className="btn btn-primary btn-sm" onClick={() => handleUploadSlot(slot.title)}>
                  <UploadCloud size={13} /> Replace
                </button>
              )}
              {/* Delete only company-issued docs */}
              {dbDoc && slot.isCompanyIssued && !slot.isSignable && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dbDoc.id, slot.title)} disabled={deleting === dbDoc.id} style={{ padding: "0 10px" }}>
                  {deleting === dbDoc.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                </button>
              )}
            </>
          ) : canUpload && !slot.isLocked ? (
            <button className="btn btn-primary btn-sm" onClick={() => handleUploadSlot(slot.title)}>
              <UploadCloud size={13} /> {status === "requested" ? "Fulfill" : "Upload"}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  // ── Build sections ──────────────────────────────────────────────────────
  const slots = getDocSlots(empType, isCompleted);
  const preSlots = slots.filter(s => s.section === "pre");
  const duringSlots = slots.filter(s => s.section === "during");
  const exitSlots = slots.filter(s => s.section === "exit");

  // Extra docs (admin custom uploads not in known slots)
  const knownTitles = new Set(slots.map(s => s.title));
  const extraDocs = documents.filter(d =>
    !knownTitles.has(d.title) &&
    !d.title?.endsWith(" Acceptance") &&
    !d.title?.includes("Warning Letter Response") &&
    !offerVariants.some(v => d.title?.includes(v))
  );

  // ── Header badges ──────────────────────────────────────────────────────
  const empTypeBadge =
    isIntern ? { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" }
    : empType === "Contract" ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" }
    : { bg: "rgba(168,85,247,0.12)", color: "var(--purple)", border: "rgba(168,85,247,0.3)" };

  const statusBadge =
    employee.status === "Active" ? { bg: "rgba(34,197,94,0.1)", color: "var(--green)", border: "rgba(34,197,94,0.2)" }
    : employee.status === "Inactive" ? { bg: "rgba(239,68,68,0.1)", color: "var(--red)", border: "rgba(239,68,68,0.2)" }
    : { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "rgba(255,255,255,0.1)" };

  const cvLink = employee.cvUrl || employee.applicant?.cvFileUrl;
  const linkedInLink = employee.linkedinUrl || employee.applicant?.linkedIn;

  // ── Section renderer ──────────────────────────────────────────────────
  const renderSection = (
    title: string,
    icon: React.ReactNode,
    color: string,
    sectionSlots: DocSlot[],
    opts?: { locked?: boolean; locked_msg?: string }
  ) => {
    const completedCount = sectionSlots.filter(s => ["signed","issued","responded"].includes(resolveStatus(s))).length;

    return (
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color, fontSize: 15 }}>{icon}</div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{title}</h2>
            <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 500 }}>{completedCount}/{sectionSlots.length}</span>
          </div>
          {opts?.locked && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
              <Lock size={10} /> {opts.locked_msg || "Locked until tenure ends"}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {sectionSlots.map(slot => <DocSlotCard key={slot.title} slot={slot} />)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Link href="/company/employees" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Employees
      </Link>

      {/* ── Employee Header ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 24, background: "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, transparent 100%)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(109,40,217,0.3))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0, fontSize: 22, fontWeight: 800 }}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{employee.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: empTypeBadge.bg, color: empTypeBadge.color, border: `1px solid ${empTypeBadge.border}`, letterSpacing: "0.04em" }}>{empType}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`, letterSpacing: "0.04em" }}>{employee.status || "Unknown"}</span>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary)" }}>
              {employee.employeeCode && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Badge size={12} /> {employee.employeeCode}</span>}
              {employee.designation && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Star size={12} /> {employee.designation}</span>}
              {employee.email && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={12} /> {employee.email}</span>}
              {employee.team && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Building2 size={12} /> {employee.team.name}</span>}
            </div>
          </div>
        </div>

        {(cvLink || linkedInLink) && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(168,85,247,0.1)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {cvLink && (
              <button onClick={() => handleViewBase64(cvLink, `${employee.name}_CV`)} className="btn btn-secondary btn-sm" style={{ fontWeight: 600, gap: 6 }}>
                <FileText size={14} color="var(--purple)" /> View Resume / CV
              </button>
            )}
            {linkedInLink && (
              <a href={linkedInLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontWeight: 600, gap: 6, color: "#3b82f6" }}>
                <User size={14} /> LinkedIn Profile
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Document Management ──────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Document Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setUploadForm({ title: "", type: "Other", base64: "", fileName: "" }); setShowUploadModal(true); }}>
          <UploadCloud size={14} /> Upload Custom Document
        </button>
      </div>

      {/* Pre-Joining — always shown */}
      {renderSection("Pre-Joining Documents", <Briefcase size={15} />, "var(--brand-primary)", preSlots)}

      {/* Onboarding Consents embedded in Pre-Joining above (signature docs are pre) */}

      {/* During Tenure — always shown */}
      {renderSection("During Tenure", <Clock size={15} />, "#3b82f6", duringSlots)}

      {/* Completion & Exit — shown with lock badge if not complete */}
      {renderSection(
        "Completion & Exit Documents",
        <Award size={15} />,
        "#22c55e",
        exitSlots,
        !isCompleted ? { locked: true, locked_msg: "Unlocks when tenure ends" } : undefined
      )}

      {/* Extra / Custom Docs */}
      {extraDocs.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <FileText size={15} color="var(--text-secondary)" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Other Documents</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {extraDocs.map(doc => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={17} style={{ color: "#6b7280" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{doc.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 20, background: STATUS_BADGES.issued.bg, color: STATUS_BADGES.issued.color, border: `1px solid ${STATUS_BADGES.issued.border}`, letterSpacing: "0.04em" }}>✅ Issued</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563" }}>Type: {doc.type}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {doc.fileUrl && (
                    <button onClick={() => handleViewBase64(doc.fileUrl, doc.title)} className="btn btn-secondary btn-sm" style={{ gap: 5 }}>
                      <Eye size={13} /> View
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id, doc.title)} disabled={deleting === doc.id} style={{ padding: "0 10px" }}>
                    {deleting === doc.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)" }}>
                <UploadCloud size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{uploadForm.title || "Upload Document"}</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>For {employee.name}</p>
              </div>
            </div>
            <form onSubmit={handleUploadSubmit} style={{ display: "grid", gap: 16 }}>
              {/* Title — prefilled if slot upload, editable if custom */}
              <div>
                <label className="label label-required">Document Title</label>
                {uploadForm.title ? (
                  <input className="input" value={uploadForm.title} readOnly style={{ opacity: 0.7 }} />
                ) : (
                  <>
                    <input className="input" list="doc-suggestions" placeholder="e.g. Warning Letter, Certificate..." value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} required />
                    <datalist id="doc-suggestions">
                      <option value="Warning Letter" />
                      <option value="Appreciation Letter" />
                      <option value="Training Certificate" />
                      <option value="Performance Review" />
                      <option value="Confirmation Letter" />
                      <option value="No Due Certificate" />
                      <option value="Full & Final Settlement" />
                      <option value="Experience Letter" />
                      <option value="Relieving Letter" />
                      <option value="Recommendation Letter" />
                      <option value="Internship Completion Certificate" />
                    </datalist>
                  </>
                )}
              </div>

              {/* File dropzone */}
              <div>
                <label className="label label-required">File (PDF / Image)</label>
                <div
                  style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: uploadForm.base64 ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)", borderColor: uploadForm.base64 ? "rgba(34,197,94,0.4)" : "var(--border)", transition: "all 0.2s" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadForm.base64 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--green)" }}>
                      <CheckCircle2 size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{uploadForm.fileName}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={24} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Click to select file</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>PDF, PNG, JPG up to 10MB</div>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" style={{ display: "none" }} accept="application/pdf,image/*" onChange={handleFileUpload} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowUploadModal(false); setUploadForm({ title: "", type: "Other", base64: "", fileName: "" }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || !uploadForm.base64}>
                  {uploading ? <Loader2 size={14} className="spin" /> : <><UploadCloud size={14} /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
