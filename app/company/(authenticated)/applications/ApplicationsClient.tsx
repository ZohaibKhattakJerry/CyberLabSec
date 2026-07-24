"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search, X, UserCheck, Loader2, FileText, Check, AlertTriangle, Clock,
  Star, CheckSquare, Square, Mail, Phone, MapPin, Link as LinkIcon, Code,
  Briefcase, GraduationCap, Calendar, Award, Trash2, ChevronRight, Eye, Download,
} from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

type Applicant = {
  id: string; fullName: string; email: string; phone: string;
  city: string | null; linkedIn: string | null; github: string | null;
  portfolio: string | null; universityName: string | null; cve: string | null;
  status: string; fitScore: number | null; fitReasoning: string | null;
  createdAt: string; jobPostingId: string;
  internalRating: number | null; privateNotes: string | null;
  motivation: string | null; semester: string | null; degree: string | null;
  cgpa: string | null; bugBounty: string | null; certifications: string | null;
  cnic: string | null; cvFileUrl?: string | null;
  jobPosting: { id: string; title: string; type: string };
  interviewSession: {
    id: string; totalScore: number | null; result: string | null;
    startedAt: string | null; completedAt: string | null;
    cheatingSignals: string; integrityViolations: string;
  } | null;
};

type Posting = { id: string; title: string };

const PIPELINE_STAGES = ["Reviewing", "Invited for Interview", "Interview Failed", "Selected \u2013 Waiting for Approval", "Hired", "Rejected"];

const STATUS_NORMALIZE: Record<string, string> = {
  "Applied": "Reviewing", "Screening": "Reviewing", "REVIEWING": "Reviewing",
  "INTERVIEWINVITED": "Invited for Interview", "InterviewInvited": "Invited for Interview",
  "SHORTLISTED": "Invited for Interview", "Shortlisted": "Invited for Interview",
  "Interview": "Invited for Interview", "Needs Retry": "Invited for Interview",
  "PASSED": "Selected \u2013 Waiting for Approval", "Passed": "Selected \u2013 Waiting for Approval",
  "Interview Passed": "Selected \u2013 Waiting for Approval", "Final Approval": "Selected \u2013 Waiting for Approval",
  "Waiting for Approval": "Selected \u2013 Waiting for Approval", "Offer": "Selected \u2013 Waiting for Approval",
  "Interview Failed": "Interview Failed", "FAILED": "Interview Failed", "Failed": "Interview Failed",
  "Blocked": "Rejected", "Withdrawn": "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  "Reviewing": "badge-blue",
  "Invited for Interview": "badge-purple",
  "Interview Failed": "badge-red",
  "Selected \u2013 Waiting for Approval": "badge-amber",
  "Hired": "badge-green",
  "Rejected": "badge-gray",
};

const STATUS_ACCENT: Record<string, string> = {
  "Reviewing": "#3b82f6",
  "Invited for Interview": "#a855f7",
  "Interview Failed": "#ef4444",
  "Selected \u2013 Waiting for Approval": "#f59e0b",
  "Hired": "#22c55e",
  "Rejected": "#6b7280",
};

// Which stages allow checkbox selection
const SELECTABLE_STAGES = ["Reviewing", "Invited for Interview", "Interview Failed", "Selected \u2013 Waiting for Approval", "Rejected"];

export default function ApplicationsClient({ applicants, postings }: { applicants: Applicant[]; postings: Posting[] }) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterPosting, setFilterPosting] = useState("All");

  const [selected, setSelected] = useState<Applicant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ratingDraft, setRatingDraft] = useState<number>(0);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showBulkHireModal, setShowBulkHireModal] = useState(false);
  const [actionTarget, setActionTarget] = useState<"bulk" | "single" | null>(null);

  const openModal = (a: Applicant) => {
    setSelected(a);
    setNotesDraft(a.privateNotes || "");
    setRatingDraft(a.internalRating || 0);
    setActionMsg("");
  };
  const closeModal = () => { setSelected(null); setActionMsg(""); setNotesDraft(""); setRatingDraft(0); };

  const toggleSelect = (id: string, stage: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      // Enforce same-stage: if selection exists and stage differs, clear and start fresh
      const currentStage = normalizedApplicants.find(a => prev[0] === a.id)?.status;
      if (prev.length > 0 && currentStage && currentStage !== stage) {
        return [id]; // clear old selection, start fresh with this item
      }
      return [...prev, id];
    });
  };

  const normalizedApplicants = applicants.map(a => ({ ...a, status: STATUS_NORMALIZE[a.status] || a.status }));

  const filtered = normalizedApplicants.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchPosting = filterPosting === "All" || a.jobPostingId === filterPosting;
    return matchSearch && matchPosting;
  });

  // Determine stage of all selected items (they should all be in same stage for bulk actions)
  const selectedApplicants = filtered.filter(a => selectedIds.includes(a.id));
  const selectedStage = selectedApplicants.length > 0 ? selectedApplicants[0].status : null;
  const allSameStage = selectedApplicants.every(a => a.status === selectedStage);

  const safeFormatDate = (dateStr: string | null | undefined, fmt: string) => {
    try { if (!dateStr) return "N/A"; return format(new Date(dateStr), fmt); }
    catch { return "N/A"; }
  };

  // ----- API Actions -----
  const copyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.success("Email copied");
  };

  const handleViewBase64 = (url: string, title: string) => {
    if (!url) return;
    if (url.startsWith("data:")) {
      try {
        const parts = url.split(",");
        const meta = parts[0];
        const contentType = meta.split(":")[1].split(";")[0];
        const base64Data = parts[1];
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        
        window.open(blobUrl, "_blank");
      } catch (e: any) {
        console.error("Failed to parse base64 for viewing", e);
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  };

  const updateStatus = async (applicantId: string, status: string) => {
    setActionLoading(true); setActionMsg("");
    const res = await fetch(`/api/company/applications/${applicantId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed"); return false; }
    if (status === "Selected \u2013 Waiting for Approval" || status === "Hired") {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
    }
    setActionMsg("Status updated successfully.");
    startTransition(() => {
      router.refresh();
      if (selected) setSelected({ ...selected, status });
    });
    return true;
  };

  const confirmBulkAction = async (action: "reject" | "delete" | "move") => {
    setShowRejectModal(false); setShowDeleteModal(false); setShowMoveModal(false);
    setActionLoading(true); setActionMsg("");
    if (action === "move") {
      const res = await fetch("/api/company/applications/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", status: "Invited for Interview", applicantIds: selectedIds }),
      });
      const data = await res.json();
      setActionLoading(false);
      if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
      setActionMsg(`Shortlisted ${selectedIds.length} candidate(s) and sent interview invitations.`);
    } else {
      const res = await fetch("/api/company/applications/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, applicantIds: selectedIds }),
      });
      const data = await res.json();
      setActionLoading(false);
      if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
      setActionMsg(`Successfully ${action === "reject" ? "rejected" : "deleted"} ${selectedIds.length} application(s).`);
    }
    setSelectedIds([]);
    startTransition(() => { router.refresh(); });
  };

  const confirmBulkHire = async () => {
    const targetIds = actionTarget === "bulk" ? selectedIds : (selected ? [selected.id] : []);
    if (targetIds.length === 0) return;

    setShowBulkHireModal(false);
    setActionLoading(true); setActionMsg("");
    const res = await fetch("/api/company/applications/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", status: "Hired", applicantIds: targetIds }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed to hire candidates"); return; }
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, zIndex: 9999 });
    
    if (actionTarget === "bulk") {
      setActionMsg(`${targetIds.length} candidate(s) approved and hired successfully!`);
      setSelectedIds([]);
    } else {
      setActionMsg("Candidate successfully hired! 🎉");
      closeModal();
    }
    startTransition(() => { router.refresh(); });
  };

  const handleSingleDelete = () => { setActionTarget("single"); setShowDeleteModal(true); };

  const confirmSingleDelete = async () => {
    if (!selected) return;
    setShowDeleteModal(false);
    setActionLoading(true); setActionMsg("");
    const res = await fetch("/api/company/applications/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", applicantIds: [selected.id] }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
    closeModal();
    startTransition(() => { router.refresh(); });
  };

  const saveNotes = async () => {
    if (!selected) return;
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/company/applications/${selected.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalRating: ratingDraft || null,
          privateNotes: notesDraft,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2500);
        // Update local selected state so UI reflects saved values immediately
        setSelected({ ...selected, internalRating: ratingDraft || null, privateNotes: notesDraft });
      } else {
        setActionMsg(data.error || "Failed to save notes. Please try again.");
      }
    } catch {
      setActionMsg("Network error. Please check your connection and try again.");
    } finally {
      setNotesSaving(false);
    }
  };

  // Drag & drop intentionally removed for reliability

  // ============================================================
  // KANBAN RENDER
  // ============================================================
  const renderKanban = () => (
    <div className="kanban-scroll-container">
      {PIPELINE_STAGES.map(stage => {
        const items = filtered.filter(a => a.status === stage);
        const accent = STATUS_ACCENT[stage] || "#6b7280";
        const isSelectable = SELECTABLE_STAGES.includes(stage);
        return (
          <div
            key={stage}
            className="kanban-column"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingRight: 6, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}60` }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{stage}</h3>
              </div>
              <span className={`badge ${STATUS_COLORS[stage]}`} style={{ fontSize: 12, minWidth: 24, textAlign: "center" }}>{items.length}</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 6 }}>
              {items.length === 0 ? (
                <div className="empty-state empty-state-sm" style={{ flex: 1, justifyContent: "center" }}>
                  <div className="empty-state-icon-wrapper"><FileText size={20} /></div>
                  <div className="empty-state-title">No candidates</div>
                  <div className="empty-state-description">Nothing here yet.</div>
                </div>
              ) : (
                items.map(a => (
                  <div
                    key={a.id}
                    className="card-hover"
                    style={{
                      padding: 14, cursor: "pointer", position: "relative",
                      background: selectedIds.includes(a.id) ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      border: selectedIds.includes(a.id) ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.07)",
                      transition: "all 0.15s ease",
                    }}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest(".cb-wrap")) return;
                      openModal(a);
                    }}
                  >
                    {/* Checkbox — only for selectable (non-Hired) stages */}
                    {isSelectable && (
                      <div
                        className="cb-wrap"
                        style={{ position: "absolute", top: 12, right: 10, color: selectedIds.includes(a.id) ? "var(--purple)" : "rgba(255,255,255,0.2)", cursor: "pointer" }}
                        onClick={e => { e.stopPropagation(); toggleSelect(a.id, a.status); }}
                      >
                        {selectedIds.includes(a.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                    )}

                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, paddingRight: isSelectable ? 24 : 0, color: "var(--text-primary)" }}>{a.fullName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{a.jobPosting.title}</div>

                    <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                      {a.linkedIn && <span style={{ fontSize: 10, padding: "2px 7px", background: "rgba(37,99,235,0.15)", color: "#60a5fa", borderRadius: 4, fontWeight: 700 }}>in</span>}
                      {a.github && <span style={{ fontSize: 10, padding: "2px 7px", background: "rgba(255,255,255,0.08)", color: "#d1d5db", borderRadius: 4, fontWeight: 700 }}>gh</span>}
                      {a.portfolio && <span style={{ fontSize: 10, padding: "2px 7px", background: "rgba(168,85,247,0.15)", color: "#c084fc", borderRadius: 4, fontWeight: 700 }}>port</span>}
                      {a.universityName && <span style={{ fontSize: 10, padding: "2px 7px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", borderRadius: 4, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.universityName}</span>}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{safeFormatDate(a.createdAt, "MMM d")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );



  // ============================================================
  // BULK ACTION BAR — stage-aware
  // ============================================================
  // Bulk bar: buttons mirror the dialog box per stage. Same-stage only enforced by toggleSelect.
  const renderBulkBar = () => {
    if (selectedIds.length === 0) return null;
    // If somehow mixed stages slipped through, show a warning bar only
    if (!allSameStage) {
      return (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--bg-elevated)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, width: "calc(100% - 32px)", maxWidth: 520, boxShadow: "0 16px 48px rgba(0,0,0,0.6)", zIndex: 200 }}>
          <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 500, flex: 1 }}>Select candidates from the same stage only.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>Clear</button>
        </div>
      );
    }
    return (
      <div className="bulk-bar-floating">
        {/* Count badge */}
        <div className="bulk-bar-info">
          <span className="bulk-bar-count">{selectedIds.length}</span>
          <span className="bulk-bar-label">selected</span>
        </div>
        
        <div className="bulk-bar-divider" />

        <div className="bulk-bar-actions">
          {/* REVIEWING */}
          {selectedStage === "Reviewing" && (
            <>
              <button className="btn btn-sm btn-primary" onClick={() => { setActionTarget("bulk"); setShowMoveModal(true); }} disabled={actionLoading}>
                <UserCheck size={13} /> Shortlist & Invite
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => { setActionTarget("bulk"); setShowRejectModal(true); }} disabled={actionLoading}>
                <X size={13} /> Reject
              </button>
            </>
          )}

          {/* INVITED FOR INTERVIEW */}
          {selectedStage === "Invited for Interview" && (
            <>
              <button className="btn btn-sm btn-secondary" onClick={() => { setActionTarget("bulk"); setShowRejectModal(true); }} disabled={actionLoading}>
                <X size={13} /> Reject
              </button>
            </>
          )}

          {/* INTERVIEW FAILED */}
          {selectedStage === "Interview Failed" && (
            <button className="btn btn-sm btn-danger" onClick={() => { setActionTarget("bulk"); setShowDeleteModal(true); }} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Delete
            </button>
          )}

          {/* SELECTED – WAITING FOR APPROVAL */}
          {selectedStage === "Selected \u2013 Waiting for Approval" && (
            <>
              <button className="btn btn-sm btn-primary" onClick={() => setShowBulkHireModal(true)} disabled={actionLoading}>
                <UserCheck size={13} /> Approve & Hire
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => { setActionTarget("bulk"); setShowRejectModal(true); }} disabled={actionLoading}>
                <X size={13} /> Reject
              </button>
            </>
          )}

          {/* REJECTED */}
          {selectedStage === "Rejected" && (
            <button className="btn btn-sm btn-danger" onClick={() => { setActionTarget("bulk"); setShowDeleteModal(true); }} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Delete
            </button>
          )}
        </div>

        <div className="bulk-bar-divider" />
        <button className="btn btn-ghost btn-sm bulk-bar-cancel" onClick={() => setSelectedIds([])} disabled={actionLoading}>Cancel</button>
      </div>
    );
  };

  // ============================================================
  // MODAL FOOTER — smart per status
  // ============================================================
  const renderModalFooter = () => {
    if (!selected) return null;
    const s = selected.status;

    return (
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-elevated)", padding: "18px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {actionMsg ? (
          <div style={{ padding: "12px 18px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, fontSize: 14, color: "var(--green)", fontWeight: 600, flex: 1, textAlign: "center" }}>
            {actionMsg}
          </div>
        ) : (
          <>
            {/* REVIEWING */}
            {s === "Reviewing" && (
              <>
                <button className="btn btn-primary" onClick={() => updateStatus(selected.id, "Invited for Interview")} disabled={actionLoading} style={{ flex: 1 }}>
                  {actionLoading ? <Loader2 size={15} className="spin" /> : <UserCheck size={15} />} Shortlist & Invite
                </button>
                <button className="btn btn-secondary" onClick={() => { setActionTarget("single"); setShowRejectModal(true); }} disabled={actionLoading} style={{ flex: 1 }}>
                  <X size={15} /> Reject
                </button>
                <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading} style={{ flex: 1 }}>
                  {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete
                </button>
              </>
            )}

            {/* INVITED FOR INTERVIEW */}
            {s === "Invited for Interview" && (
              <>
                <button className="btn btn-secondary" onClick={() => { setActionTarget("single"); setShowRejectModal(true); }} disabled={actionLoading} style={{ flex: 1 }}>
                  <X size={15} /> Reject
                </button>
                <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading} style={{ flex: 1 }}>
                  {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete
                </button>
              </>
            )}

            {/* INTERVIEW FAILED */}
            {s === "Interview Failed" && (
              <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading} style={{ flex: 1 }}>
                {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete Application
              </button>
            )}

            {/* SELECTED – WAITING FOR APPROVAL */}
            {s === "Selected \u2013 Waiting for Approval" && (
              <>
                <button className="btn btn-primary" onClick={() => { setActionTarget("single"); setShowBulkHireModal(true); }} disabled={actionLoading} style={{ flex: 1 }}>
                  {actionLoading ? <Loader2 size={15} className="spin" /> : <UserCheck size={15} />} Approve & Hire
                </button>
                <button className="btn btn-secondary" onClick={() => { setActionTarget("single"); setShowRejectModal(true); }} disabled={actionLoading} style={{ flex: 1 }}>
                  <X size={15} /> Reject
                </button>
                <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading} style={{ flex: 1 }}>
                  {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete
                </button>
              </>
            )}

            {/* HIRED — no buttons at all */}
            {s === "Hired" && (
              <div style={{ flex: 1, textAlign: "center", fontSize: 14, color: "var(--green)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Check size={18} /> This candidate has been hired.
              </div>
            )}

            {/* REJECTED */}
            {s === "Rejected" && (
              <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading} style={{ flex: 1 }}>
                {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete Application
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="applications-page-container">
      {/* Page Header & Filters */}
      <div className="flex-mobile-col" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Applications Pipeline</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{applicants.length} total applications</p>
        </div>
        
        {/* Filters integrated into Header */}
        <div className="flex-mobile-col" style={{ display: "flex", gap: 12, flex: 1, maxWidth: 500, width: "100%", justifyContent: "flex-end" }}>
          <div style={{ position: "relative", flex: 1, width: "100%" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input className="input" style={{ paddingLeft: 36, width: "100%" }} placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ flex: 1, width: "100%" }} value={filterPosting} onChange={e => setFilterPosting(e.target.value)}>
            <option value="All">All Positions</option>
            {postings.map((p: Posting) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {renderKanban()}

      {renderBulkBar()}

      {/* ====== CANDIDATE DETAIL MODAL ====== */}
      {selected && (
        <div
          className="candidate-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="candidate-modal-card">

            {/* ---- HEADER ---- */}
            <div className="cm-header">
              <div className="cm-header-row">
                <div className="cm-header-left">
                  {/* Name + Status Badge */}
                  <div className="cm-name-row">
                    <h2 className="cm-name">{selected.fullName}</h2>
                    <span className={`badge ${STATUS_COLORS[selected.status] || "badge-gray"}`} style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", letterSpacing: "0.04em", flexShrink: 0 }}>
                      {selected.status}
                    </span>
                  </div>
                  {/* Contact info as pills — truncate, no overflow */}
                  <div className="cm-contact-row">
                    <span className="cm-contact-pill">
                      <Mail size={11} color="rgba(168,85,247,0.9)" style={{ flexShrink: 0 }} />
                      {selected.email}
                    </span>
                    <span className="cm-contact-pill">
                      <Phone size={11} color="rgba(168,85,247,0.9)" style={{ flexShrink: 0 }} />
                      {selected.phone}
                    </span>
                    {selected.city && (
                      <span className="cm-contact-pill">
                        <MapPin size={11} color="rgba(168,85,247,0.9)" style={{ flexShrink: 0 }} />
                        {selected.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: CV + Close */}
                <div className="cm-header-actions">
                  <button onClick={() => handleViewBase64(selected.cvFileUrl || `/api/files/${selected.id}/cv`, "CV")} className="cm-cv-btn" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
                    <Eye size={14} style={{ flexShrink: 0 }} />
                    <span>View CV</span>
                  </button>
                  <a href={selected.cvFileUrl || `/api/files/${selected.id}/cv`} download={`CV_${selected.fullName.replace(/\\s+/g, "_")}.pdf`} className="cm-cv-btn" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)", textDecoration: "none" }}>
                    <Download size={14} style={{ flexShrink: 0 }} />
                    <span>Download</span>
                  </a>
                  <button className="cm-close-btn" onClick={closeModal}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* ---- BODY (scrollable) ---- */}
            <div className="cm-body cm-desktop-grid">
              
              <div className="cm-left-col" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Position + Applied date cards */}
                <div className="cm-info-grid">
                  <div className="cm-info-card" style={{ background: "rgba(168,85,247,0.06)", borderColor: "rgba(168,85,247,0.14)" }}>
                    <div className="cm-info-card-icon" style={{ background: "rgba(168,85,247,0.14)" }}>
                      <Briefcase size={18} color="#a855f7" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="cm-info-card-label">Position</div>
                      <div className="cm-info-card-value">{selected.jobPosting.title}</div>
                    </div>
                  </div>
                  <div className="cm-info-card" style={{ background: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.14)" }}>
                    <div className="cm-info-card-icon" style={{ background: "rgba(59,130,246,0.14)" }}>
                      <Calendar size={18} color="#3b82f6" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="cm-info-card-label">Applied</div>
                      <div className="cm-info-card-value">{safeFormatDate(selected.createdAt, "MMM d, yyyy")}</div>
                    </div>
                  </div>
                </div>

                {/* Profile Links */}
                {(selected.linkedIn || selected.github || selected.portfolio || selected.universityName) && (
                  <div>
                    <div className="cm-section-label">Online Presence</div>
                    <div className="cm-links-row">
                      {selected.universityName && (
                        <span className="cm-link-chip" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                          <GraduationCap size={14} color="rgba(255,255,255,0.35)" /> {selected.universityName}
                        </span>
                      )}
                      {selected.linkedIn && (
                        <a href={selected.linkedIn} target="_blank" rel="noopener noreferrer"
                          className="cm-link-chip" style={{ background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                          <LinkIcon size={14} /> LinkedIn
                        </a>
                      )}
                      {selected.github && (
                        <a href={selected.github} target="_blank" rel="noopener noreferrer"
                          className="cm-link-chip" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
                          <Code size={14} /> GitHub
                        </a>
                      )}
                      {selected.portfolio && (
                        <a href={selected.portfolio} target="_blank" rel="noopener noreferrer"
                          className="cm-link-chip" style={{ background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                          <LinkIcon size={14} /> Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical / Meta Info */}
                {(selected.degree || selected.bugBounty || selected.certifications || selected.cnic || selected.semester || selected.cgpa || selected.cve) && (
                  <div>
                    <div className="cm-section-label">Additional Information</div>
                    <div className="cm-extra-grid" style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
                      {selected.degree && <div><div className="cm-extra-item-label">Degree</div><div className="cm-extra-item-value">{selected.degree}</div></div>}
                      {selected.semester && <div><div className="cm-extra-item-label">Semester</div><div className="cm-extra-item-value">{selected.semester}</div></div>}
                      {selected.cgpa && <div><div className="cm-extra-item-label">CGPA</div><div className="cm-extra-item-value">{selected.cgpa}</div></div>}
                      {selected.cnic && <div><div className="cm-extra-item-label">CNIC</div><div className="cm-extra-item-value">{selected.cnic}</div></div>}
                      {selected.certifications && <div style={{ gridColumn: "1/-1" }}><div className="cm-extra-item-label">Certifications</div><div className="cm-extra-item-value">{selected.certifications}</div></div>}
                      {selected.cve && <div style={{ gridColumn: "1/-1" }}><div className="cm-extra-item-label">CVEs</div><div className="cm-extra-item-value">{selected.cve}</div></div>}
                      {selected.bugBounty && <div style={{ gridColumn: "1/-1" }}><div className="cm-extra-item-label">Bug Bounty</div><a href={selected.bugBounty} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#c084fc", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4, wordBreak: "break-all" }}>{selected.bugBounty}</a></div>}
                    </div>
                  </div>
                )}
              </div>

              <div className="cm-right-col" style={{ display: "flex", flexDirection: "column" }}>
                {/* Motivation Text (Spans height natively) */}
                {selected.motivation && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div className="cm-section-label">Why CyberLabSec?</div>
                    <div style={{ padding: "20px", background: "rgba(168,85,247,0.04)", borderRadius: 12, border: "1px solid rgba(168,85,247,0.1)", flex: 1 }}>
                      <p className="cm-motivation" style={{ margin: 0 }}>{selected.motivation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---- FOOTER (stage-aware actions) ---- */}
            <div className="cm-footer">
              {actionMsg ? (
                <div className="cm-action-msg">{actionMsg}</div>
              ) : (
                <>
                  {/* REVIEWING */}
                  {selected.status === "Reviewing" && (
                    <div className="cm-footer-actions">
                      <button className="btn btn-primary" onClick={() => updateStatus(selected.id, "Invited for Interview")} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <UserCheck size={15} />} Shortlist & Invite
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setActionTarget("single"); setShowRejectModal(true); }} disabled={actionLoading}>
                        <X size={15} /> Reject
                      </button>
                      <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete
                      </button>
                    </div>
                  )}
                  {/* INVITED FOR INTERVIEW */}
                  {selected.status === "Invited for Interview" && (
                    <div className="cm-footer-actions">
                      <button className="btn btn-secondary" onClick={() => { setActionTarget("single"); setShowRejectModal(true); }} disabled={actionLoading}>
                        <X size={15} /> Reject
                      </button>
                      <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete
                      </button>
                    </div>
                  )}
                  {/* INTERVIEW FAILED */}
                  {selected.status === "Interview Failed" && (
                    <div className="cm-footer-actions">
                      <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete Application
                      </button>
                    </div>
                  )}
                  {/* SELECTED – WAITING FOR APPROVAL */}
                  {selected.status === "Selected \u2013 Waiting for Approval" && (
                    <div className="cm-footer-actions">
                      <button className="btn btn-primary" onClick={() => { setActionTarget("single"); setShowBulkHireModal(true); }} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <UserCheck size={15} />} Approve & Hire
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setActionTarget("single"); setShowRejectModal(true); }} disabled={actionLoading}>
                        <X size={15} /> Reject
                      </button>
                      <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete
                      </button>
                    </div>
                  )}
                  {/* HIRED */}
                  {selected.status === "Hired" && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, color: "#4ade80", fontWeight: 600, padding: "8px 0" }}>
                      <Check size={18} /> This candidate has been hired.
                    </div>
                  )}
                  {/* REJECTED */}
                  {selected.status === "Rejected" && (
                    <div className="cm-footer-actions">
                      <button className="btn btn-danger" onClick={handleSingleDelete} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} Delete Application
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ====== REJECT CONFIRMATION MODAL ====== */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={22} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Confirm Rejection</h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {actionTarget === "bulk"
                ? `This will reject ${selectedIds.length} candidate(s) and notify them via email. This action cannot be undone.`
                : "This will move the candidate to Rejected status and notify them respectfully via email. Are you sure?"}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRejectModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} disabled={actionLoading}
                onClick={async () => {
                  if (actionTarget === "bulk") {
                    await confirmBulkAction("reject");
                  } else if (selected) {
                    setShowRejectModal(false);
                    const ok = await updateStatus(selected.id, "Rejected");
                    if (ok) closeModal();
                  }
                }}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE CONFIRMATION MODAL ====== */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={22} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Confirm Deletion</h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {actionTarget === "bulk"
                ? `This will permanently delete ${selectedIds.length} application(s) and all attached files. This is irreversible.`
                : "This will permanently delete this application and all attached files. This action cannot be undone."}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} disabled={actionLoading}
                onClick={() => actionTarget === "bulk" ? confirmBulkAction("delete") : confirmSingleDelete()}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MOVE TO INTERVIEW CONFIRMATION MODAL ====== */}
      {showMoveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={22} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Move to Interview Stage</h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              This will move {selectedIds.length} candidate(s) to the <strong style={{ color: "var(--purple-light)" }}>Invited for Interview</strong> stage and send them an interview invitation email.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowMoveModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading} onClick={() => confirmBulkAction("move")}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : <ChevronRight size={14} />} Confirm & Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== BULK APPROVE & HIRE CONFIRMATION MODAL ====== */}
      {showBulkHireModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserCheck size={22} color="#22c55e" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  {actionTarget === "bulk" ? `Approve & Hire ${selectedIds.length} Candidate(s)` : "Approve & Hire Candidate"}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>This will move to Hired status</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {actionTarget === "bulk" 
                ? <><strong style={{ color: "#4ade80" }}>{selectedIds.length}</strong> selected candidate(s) will be approved</> 
                : <>This candidate will be approved</>
              } and transitioned to <strong style={{ color: "#4ade80" }}>Hired</strong> status. This action will reflect immediately across the platform.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBulkHireModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading} onClick={confirmBulkHire}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />} Confirm Hire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
