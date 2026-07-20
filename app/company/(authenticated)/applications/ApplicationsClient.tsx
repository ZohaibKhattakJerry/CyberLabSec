"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Filter, X, Eye, UserCheck, UserX, Loader2, FileText, ChevronRight, Check, AlertTriangle, Clock, Star, CheckSquare, Square, Mail, Phone, MapPin, Link as LinkIcon, Code, Briefcase, GraduationCap, Calendar } from "lucide-react";
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
  cnic: string | null;
  jobPosting: { id: string; title: string; type: string };
  interviewSession: { 
    id: string; totalScore: number | null; result: string | null; 
    startedAt: string | null; completedAt: string | null;
    cheatingSignals: string; integrityViolations: string;
  } | null;
};

type Posting = { id: string; title: string };

const PIPELINE_STAGES = ["Reviewing", "Invited for Interview", "Interview Failed", "Selected – Waiting for Approval", "Hired", "Rejected"];
const STATUS_NORMALIZE: Record<string, string> = {
  "Applied": "Reviewing",
  "Screening": "Reviewing",
  "REVIEWING": "Reviewing",
  "INTERVIEWINVITED": "Invited for Interview",
  "InterviewInvited": "Invited for Interview",
  "SHORTLISTED": "Invited for Interview",
  "Shortlisted": "Invited for Interview",
  "Interview": "Invited for Interview",
  "Needs Retry": "Invited for Interview",
  "PASSED": "Selected – Waiting for Approval",
  "Passed": "Selected – Waiting for Approval",
  "Interview Passed": "Selected – Waiting for Approval",
  "Final Approval": "Selected – Waiting for Approval",
  "Waiting for Approval": "Selected – Waiting for Approval",
  "Offer": "Selected – Waiting for Approval",
  "Interview Failed": "Interview Failed",
  "FAILED": "Interview Failed",
  "Failed": "Interview Failed",
  "Blocked": "Rejected",
  "Withdrawn": "Rejected"
};
const STATUS_COLORS: Record<string, string> = {
  "Reviewing": "badge-blue",
  "Invited for Interview": "badge-purple", 
  "Interview Failed": "badge-red",
  "Selected – Waiting for Approval": "badge-amber",
  "Hired": "badge-green",
  "Rejected": "badge-gray"
};

export default function ApplicationsClient({ applicants, postings }: { applicants: Applicant[]; postings: Posting[] }) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterPosting, setFilterPosting] = useState("All");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
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
  const [actionTarget, setActionTarget] = useState<"bulk" | "single" | null>(null);
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [offerNotes, setOfferNotes] = useState("");
  const [offerSalary, setOfferSalary] = useState("");
  const [offerJoinDate, setOfferJoinDate] = useState("");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(a => a.id));
  };

  const handleBulkAction = async (action: "reject" | "delete") => {
    if (selectedIds.length === 0) return;
    setActionTarget("bulk");
    if (action === "reject") setShowRejectModal(true);
    if (action === "delete") setShowDeleteModal(true);
  };
  
  const confirmBulkAction = async (action: "reject" | "delete") => {
    setShowRejectModal(false); setShowDeleteModal(false);
    
    setActionLoading(true); setActionMsg("");
    const res = await fetch("/api/company/applications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, applicantIds: selectedIds }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
    
    setActionMsg(`Successfully ${action === "reject" ? "rejected" : "deleted"} ${selectedIds.length} application(s).`);
    setSelectedIds([]);
    startTransition(() => { router.refresh(); });
  };

  const handleSingleDelete = async (id: string) => {
    setActionTarget("single");
    setShowDeleteModal(true);
  };
  
  const confirmSingleDelete = async () => {
    if (!selected) return;
    setShowDeleteModal(false);
    setActionLoading(true); setActionMsg("");
    const res = await fetch("/api/company/applications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", applicantIds: [id] }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
    setSelected(null);
    startTransition(() => { router.refresh(); });
  };

  const safeFormatDate = (dateStr: string | null | undefined, fmt: string) => {
    try {
      if (!dateStr) return "N/A";
      return format(new Date(dateStr), fmt);
    } catch {
      return "N/A";
    }
  };

  const normalizedApplicants = applicants.map(a => ({ ...a, status: STATUS_NORMALIZE[a.status] || a.status }));

  const filtered = normalizedApplicants.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchPosting = filterPosting === "All" || a.jobPostingId === filterPosting;
    return matchSearch && matchPosting;
  });

  const updateStatus = async (applicantId: string, status: string) => {
    setActionLoading(true); setActionMsg("");
    const res = await fetch(`/api/company/applications/${applicantId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
    
    if (status === "Selected – Waiting for Approval" || status === "Hired") {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
    }
    
    setActionMsg("Status updated.");
    startTransition(() => { 
      router.refresh(); 
      if (selected) {
        setSelected({...selected, status: status});
      }
    });
  };

  const saveNotes = async () => {
    if (!selected) return;
    setNotesSaving(true);
    const res = await fetch(`/api/company/applications/${selected.id}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalRating: ratingDraft || null, privateNotes: notesDraft }),
    });
    setNotesSaving(false);
    if (res.ok) {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
      setSelected({ ...selected, internalRating: ratingDraft || null, privateNotes: notesDraft });
    }
  };

  const hireApplicant = async (applicantId: string) => {
    setShowOfferModal(true);
  };

  const confirmHireWithOffer = async () => {
    if (!selected) return;
    if (!offerFile) {
      setActionMsg("Please select an Offer Letter PDF.");
      return;
    }
    
    setActionLoading(true);
    setActionMsg("Finalizing hire and uploading offer letter...");
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = (reader.result as string).split(',')[1];
        
        const res = await fetch(`/api/company/applications/${selected.id}/hire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerLetterBase64: base64Str,
            customMessage: offerNotes,
            startingSalary: offerSalary,
            expectedJoinDate: offerJoinDate
          })
        });
        const data = await res.json();
        setActionLoading(false);
        if (!res.ok) { setActionMsg(data.error || "Failed to hire candidate"); return; }
        
        setShowOfferModal(false);
        setSelected(null);
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, zIndex: 9999 });
        
        setActionMsg(`Candidate successfully hired! 🎉`);
        startTransition(() => { 
          router.refresh(); 
          setTimeout(() => setActionMsg(""), 3000);
        });
      };
      reader.readAsDataURL(offerFile);
    } catch (err: any) {
      setActionLoading(false);
      setActionMsg(err.message || "Failed to process offer letter");
    }
  };

  const manualShortlist = async (applicantId: string) => {
    if (!confirm("Are you sure you want to invite this applicant for an interview?")) return;
    setActionLoading(true); setActionMsg("");
    
    const res = await fetch(`/api/company/applications/${applicantId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Invited for Interview" }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed to invite applicant"); return; }
    setActionMsg(`Interview invite sent!`);
    startTransition(() => { 
      router.refresh(); 
      if (selected) {
        setSelected({...selected, status: "Invited for Interview"});
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, applicantId: string) => {
    e.dataTransfer.setData("applicantId", applicantId);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const applicantId = e.dataTransfer.getData("applicantId");
    if (!applicantId) return;
    
    const applicant = applicants.find(a => a.id === applicantId);
    if (!applicant || applicant.status === newStage) return;

    if (newStage === "Invited for Interview") {
      await manualShortlist(applicantId);
      return;
    }
    
    if (newStage === "Hired") {
      await hireApplicant(applicantId);
      return;
    }

    // Standard status update
    setActionLoading(true);
    setActionMsg("");
    const res = await fetch(`/api/company/applications/${applicantId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStage }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionMsg(data.error || "Failed to update status");
      return;
    }
    startTransition(() => { router.refresh(); });
  };

  const renderKanban = () => {
    return (
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, height: "calc(100vh - 220px)", minHeight: 500, width: "100%" }}>
        {PIPELINE_STAGES.map(stage => {
          const items = filtered.filter(a => a.status === stage);
          return (
            <div 
              key={stage} 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => handleDrop(e, stage)}
              style={{ flex: "0 0 320px", background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "16px 8px 16px 16px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingRight: 8, flexShrink: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{stage}</h3>
                <span className={`badge ${STATUS_COLORS[stage]}`}>{items.length}</span>
              </div>
              
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 8 }}>
                {items.length === 0 ? (
                  <div className="empty-state empty-state-sm" style={{ flex: 1, justifyContent: "center" }}>
                    <div className="empty-state-icon-wrapper">
                      <FileText size={20} />
                    </div>
                    <div className="empty-state-title">No candidates</div>
                    <div className="empty-state-description">Nothing to show in this stage yet.</div>
                  </div>
                ) : (
                  items.map(a => (
                    <div 
                      key={a.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, a.id)}
                      className={`card ${selectedIds.includes(a.id) ? 'selected' : ''} card-hover`} 
                      style={{ padding: 16, width: "100%", cursor: "grab", transition: "transform 0.1s", position: "relative", border: selectedIds.includes(a.id) ? "1px solid var(--purple)" : "1px solid var(--border)", flexShrink: 0 }} 
                      onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.checkbox-container')) return;
                      setSelected(a);
                      setNotesDraft(a.privateNotes || "");
                      setRatingDraft(a.internalRating || 0);
                    }}>
                      {a.status !== "Hired" ? (
                        <div className="checkbox-container" style={{ position: "absolute", top: 12, right: 12, color: selectedIds.includes(a.id) ? "var(--purple)" : "var(--text-muted)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); toggleSelect(a.id); }}>
                          {selectedIds.includes(a.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                      ) : (
                        <div style={{ position: "absolute", top: 12, right: 12, color: "var(--red)", cursor: "pointer", opacity: 0.7 }} className="hover-opacity-100" onClick={(e) => { e.stopPropagation(); setSelected(a); handleSingleDelete(a.id); }}>
                          <X size={16} />
                        </div>
                      )}
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, paddingRight: 24 }}>{a.fullName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span>{a.jobPosting.title}</span>
                        {a.employeeRecord?.status === "Terminated" && (
                          <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 4, fontWeight: 700 }}>TERMINATED</span>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                        {a.linkedIn && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(37,99,235,0.1)", color: "#3b82f6", borderRadius: 4, fontWeight: 600 }}>In</span>}
                        {a.github && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.1)", color: "var(--text-secondary)", borderRadius: 4, fontWeight: 600 }}>GH</span>}
                        {a.portfolio && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(168,85,247,0.1)", color: "var(--purple-light)", borderRadius: 4, fontWeight: 600 }}>Port</span>}
                        {a.universityName && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", borderRadius: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>{a.universityName}</span>}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {a.fitScore !== null ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: a.fitScore >= 70 ? "var(--green)" : a.fitScore >= 50 ? "var(--amber)" : "var(--purple)" }}>
                            AI Match: {a.fitScore}%
                          </span>
                        ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No Score</span>}
                        
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{safeFormatDate(a.createdAt, "MMM d")}</span>
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
  };

  const renderList = () => {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40, cursor: "pointer", color: filtered.length > 0 && selectedIds.length === filtered.length ? "var(--purple)" : "var(--text-muted)" }} onClick={selectAll}>
                {filtered.length > 0 && selectedIds.length === filtered.length ? <CheckSquare size={18} /> : <Square size={18} />}
              </th>
              <th>Applicant</th>
              <th>Position</th>
              <th>AI Score</th>
              <th>Stage</th>
              <th>Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: Applicant) => (
              <tr key={a.id} style={{ background: selectedIds.includes(a.id) ? "rgba(168,85,247,0.05)" : undefined }}>
                <td data-label="Select" onClick={() => { if (a.status !== "Hired") toggleSelect(a.id); }} style={{ cursor: a.status === "Hired" ? "default" : "pointer", color: selectedIds.includes(a.id) ? "var(--purple)" : "var(--text-muted)" }}>
                  {a.status !== "Hired" && (selectedIds.includes(a.id) ? <CheckSquare size={18} /> : <Square size={18} />)}
                </td>
                <td data-label="Applicant">
                  <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {a.fullName}
                    {a.employeeRecord?.status === "Terminated" && (
                      <span style={{ fontSize: 9, padding: "2px 4px", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 4, fontWeight: 700 }}>TERMINATED</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.email}</div>
                </td>
                <td data-label="Position">
                  <div style={{ fontSize: 13 }}>{a.jobPosting.title}</div>
                </td>
                <td data-label="AI Score">
                  {a.fitScore !== null ? (
                    <span style={{ fontWeight: 700, color: a.fitScore >= 70 ? "var(--green)" : a.fitScore >= 50 ? "var(--amber)" : "var(--purple)" }}>
                      {a.fitScore}%
                    </span>
                  ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td data-label="Stage"><span className={`badge ${STATUS_COLORS[a.status] || "badge-gray"}`}>{a.status}</span></td>
                <td data-label="Applied" style={{ fontSize: 12, color: "var(--text-muted)" }}>{safeFormatDate(a.createdAt, "MMM d, yyyy")}</td>
                <td data-label="Actions">
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(a); setNotesDraft(a.privateNotes || ""); setRatingDraft(a.internalRating || 0); }}><Eye size={13} /> View</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => { setSelected(a); handleSingleDelete(a.id); }}><X size={13} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon-wrapper">
              <Search size={28} />
            </div>
            <div className="empty-state-title">No candidates found</div>
            <div className="empty-state-description">Adjust your filters or search query to find candidates.</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex-mobile-col" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Applications Pipeline</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{applicants.length} total applications</p>
        </div>
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", padding: 4, borderRadius: 8 }}>
          <button className={`btn btn-sm ${viewMode === "kanban" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setViewMode("kanban")}>Kanban</button>
          <button className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setViewMode("list")}>List</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ flex: 1, minWidth: 200, maxWidth: 400 }} value={filterPosting} onChange={e => setFilterPosting(e.target.value)}>
          <option value="All">All Positions</option>
          {postings.map((p: Posting) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {viewMode === "kanban" ? renderKanban() : renderList()}

      {selectedIds.length > 0 && (() => {
        const selectedApplicants = filtered.filter(a => selectedIds.includes(a.id));
        const canReject = selectedApplicants.every(a => !["Rejected", "Hired", "Interview Failed", "Withdrawn"].includes(a.status));
        return (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--bg-elevated)", border: "1px solid var(--purple)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center", width: "calc(100% - 32px)", maxWidth: "max-content", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, color: "var(--purple)" }}>{selectedIds.length}</span>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>selected</span>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--border)" }} />
            <div style={{ display: "flex", gap: 12 }}>
              {canReject && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAction("reject")} disabled={actionLoading} style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>
                  {actionLoading ? <Loader2 size={14} className="spin" /> : "Bulk Reject"}
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => handleBulkAction("delete")} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : "Bulk Delete"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])} disabled={actionLoading}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ maxWidth: 760, width: "100%", padding: 0, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
            
            {/* Header Area */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
              <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "var(--text-primary)" }}>{selected.fullName}</h2>
                    <span className={`badge ${STATUS_COLORS[selected.status] || "badge-gray"}`} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px" }}>
                      {selected.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "16px 24px", alignItems: "center", flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} color="var(--text-tertiary)" /> {selected.email}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} color="var(--text-tertiary)" /> {selected.phone}</span>
                    {selected.city && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="var(--text-tertiary)" /> {selected.city}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <a href={`/api/files/${selected.id}/cv`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6, fontWeight: 600, background: "rgba(255,255,255,0.05)" }}>
                    <FileText size={14} /> View CV
                  </a>
                  <button onClick={() => { setSelected(null); setActionMsg(""); setNotesDraft(""); setRatingDraft(0); }} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--border)", borderRadius: "50%", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.2s" }} className="hover-bg-white-5">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: "32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
              
              {/* Core Details */}
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase size={22} color="var(--purple)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500 }}>Applied Position</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{selected.jobPosting.title}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={22} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 500 }}>Application Date</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{safeFormatDate(selected.createdAt, "MMMM d, yyyy")}</div>
                  </div>
                </div>
              </div>

              {/* Extended Profile Links */}
              {(selected.linkedIn || selected.github || selected.portfolio || selected.universityName) && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><MapPin size={14} color="var(--purple)" /> Candidate Background</h3>
                  <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {selected.universityName && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                        <GraduationCap size={16} color="var(--text-muted)" />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.universityName}</span>
                      </div>
                    )}
                    {selected.linkedIn && (
                      <a href={selected.linkedIn} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#3b82f6", padding: "12px 16px", background: "rgba(59,130,246,0.05)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.15)", textDecoration: "none", fontWeight: 500 }} className="hover-bg-blue-10">
                        <LinkIcon size={16} /> LinkedIn Profile
                      </a>
                    )}
                    {selected.github && (
                      <a href={selected.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-primary)", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid var(--border)", textDecoration: "none", fontWeight: 500 }} className="hover-bg-white-10">
                        <Code size={16} /> GitHub Profile
                      </a>
                    )}
                    {selected.portfolio && (
                      <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--purple-light)", padding: "12px 16px", background: "rgba(168,85,247,0.05)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.15)", textDecoration: "none", fontWeight: 500 }} className="hover-bg-purple-10">
                        <LinkIcon size={16} /> Portfolio Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Assessment Section */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Star size={14} color="var(--amber)" /> Technical Assessment</h3>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Technical Interview Score</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--purple)" }}>{selected.interviewSession?.totalScore ?? "—"}%</div>
                  </div>
                    
                    {selected.interviewSession ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                          <Clock size={14} color="var(--text-muted)" />
                          {selected.interviewSession.startedAt && selected.interviewSession.completedAt ? (
                            <span>Completed in <strong>{Math.round((new Date(selected.interviewSession.completedAt).getTime() - new Date(selected.interviewSession.startedAt).getTime()) / 60000)} mins</strong></span>
                          ) : "Time unknown"}
                        </div>
                        
                        {(() => {
                          try {
                            const signals = selected.interviewSession?.cheatingSignals ? JSON.parse(selected.interviewSession.cheatingSignals) : {};
                            const violations = selected.interviewSession?.integrityViolations ? JSON.parse(selected.interviewSession.integrityViolations) : [];
                            const violationList = Array.isArray(violations) ? violations : [];
                            const pasteAttempts = signals?.pasteAttempts || 0;
                            const tabBlurCount = signals?.tabBlurCount || 0;
                            const hasViolations = violationList.length > 0 || pasteAttempts > 0 || tabBlurCount > 0;
                            
                            if (!hasViolations) {
                              return <div style={{ fontSize: 13, color: "var(--green)", padding: "10px 12px", background: "rgba(34,197,94,0.05)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}><Check size={14} /> <span>No integrity violations</span></div>;
                            }
                            return (
                              <div style={{ padding: "10px 12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8 }}>
                                <div style={{ fontSize: 13, color: "var(--amber)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                                  <AlertTriangle size={14} /> Integrity Flags
                                </div>
                                <ul style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, paddingLeft: 16 }}>
                                  {pasteAttempts > 0 && <li>{pasteAttempts} paste attempts</li>}
                                  {tabBlurCount > 0 && <li>{tabBlurCount} tab switches</li>}
                                </ul>
                              </div>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text-muted)", padding: "24px", background: "rgba(255,255,255,0.01)", borderRadius: 8 }}>
                        Interview not completed yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra Info (Motivation, Degree, etc) */}
              {(selected.motivation || selected.degree || selected.bugBounty || selected.certifications || selected.cnic) && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><FileText size={14} color="var(--purple)" /> Additional Information</h3>
                  <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                    {selected.motivation && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Why CyberLabSec?</div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0, padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "2px solid var(--purple)" }}>
                          {selected.motivation}
                        </p>
                      </div>
                    )}
                    <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                      {selected.degree && <div><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Degree</div><div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{selected.degree}</div></div>}
                      {selected.semester && <div><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Semester</div><div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{selected.semester}</div></div>}
                      {selected.cgpa && <div><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>CGPA</div><div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{selected.cgpa}</div></div>}
                      {selected.cnic && <div><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>CNIC</div><div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{selected.cnic}</div></div>}
                      {selected.certifications && <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Certifications</div><div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{selected.certifications}</div></div>}
                      {selected.cve && <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>CVEs</div><div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{selected.cve}</div></div>}
                      {selected.bugBounty && <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Bug Bounty</div><a href={selected.bugBounty} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--purple)", fontWeight: 500, textDecoration: "none" }}>{selected.bugBounty}</a></div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Scorecard */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Award size={14} color="var(--amber)" /> Internal Scorecard</h3>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginRight: 4 }}>Admin Rating:</span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingDraft(star === ratingDraft ? 0 : star)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "all 0.2s" }}
                          className="hover-bg-white-5"
                        >
                          <Star
                            size={22}
                            fill={(ratingDraft || selected.internalRating || 0) >= star ? "#f59e0b" : "none"}
                            color={(ratingDraft || selected.internalRating || 0) >= star ? "#f59e0b" : "var(--border-subtle)"}
                          />
                        </button>
                      ))}
                    </div>
                    {(ratingDraft || selected.internalRating) ? (
                      <span style={{ fontSize: 13, color: "var(--amber)", fontWeight: 700, marginLeft: 4 }}>{ratingDraft || selected.internalRating}/5</span>
                    ) : <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 4 }}>Not rated</span>}
                  </div>
                  
                  <div style={{ position: "relative" }}>
                    <textarea
                      className="input"
                      placeholder="Add private notes about this candidate (only visible to admins)..."
                      style={{ minHeight: 100, fontSize: 13, resize: "vertical", marginBottom: 16, background: "var(--bg-base)", border: "1px solid var(--border)" }}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                    />
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 8, fontWeight: 600, background: notesSaved ? "rgba(34,197,94,0.1)" : undefined, color: notesSaved ? "var(--green)" : undefined, borderColor: notesSaved ? "rgba(34,197,94,0.3)" : undefined }}
                      onClick={saveNotes}
                      disabled={notesSaving}
                    >
                      {notesSaving ? <Loader2 size={14} className="spin" /> : notesSaved ? <Check size={14} /> : <Star size={14} />}
                      {notesSaved ? "Successfully Saved" : "Save Scorecard"}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Footer Actions */}
            <div style={{ padding: "20px 32px", borderTop: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              {actionMsg ? (
                <div style={{ padding: "8px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, fontSize: 13, color: "var(--green)", fontWeight: 500, flex: 1 }}>
                  {actionMsg}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
                  {selected.status === "Selected – Waiting for Approval" && (
                    <button className="btn btn-primary" onClick={() => hireApplicant(selected.id)} disabled={actionLoading} style={{ border: "none", fontWeight: 600 }}>
                      {actionLoading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />}
                      Approve & Hire
                    </button>
                  )}
                  {selected.status === "Reviewing" && (
                    <button className="btn btn-primary" onClick={() => updateStatus(selected.id, "Invited for Interview")} disabled={actionLoading} style={{ fontWeight: 600 }}>
                      {actionLoading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />}
                      Shortlist & Invite
                    </button>
                  )}
                  {(!["Rejected", "Hired", "Interview Failed", "Withdrawn"].includes(selected.status)) && (
                    <button className="btn btn-secondary" onClick={() => { updateStatus(selected.id, "Rejected"); setSelected(null); }} disabled={actionLoading} style={{ color: "var(--amber)", borderColor: "var(--border-subtle)", fontWeight: 600 }}>
                      <X size={14} /> Reject
                    </button>
                  )}
                </div>
              )}
              
              {selected.status !== "Hired" && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleSingleDelete(selected.id)}
                  disabled={actionLoading}
                  style={{ fontWeight: 600, background: "transparent", borderColor: "var(--red)", color: "var(--red)" }}
                >
                  Delete Application
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Confirm Hire</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Please attach the signed offer letter (PDF). This will be emailed to the candidate securely and they will be transitioned to active Employee status.
            </p>
            
            <input 
              type="file" 
              accept=".pdf" 
              className="input" 
              style={{ marginBottom: 16 }}
              onChange={e => setOfferFile(e.target.files?.[0] || null)}
            />
            
            <textarea
              className="input"
              placeholder="Optional message to include in the email..."
              style={{ minHeight: 80, marginBottom: 16, resize: "vertical" }}
              value={offerNotes}
              onChange={e => setOfferNotes(e.target.value)}
            />

            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <label className="label">Starting Salary (Optional)</label>
                <input type="text" className="input" placeholder="$0 / PK 0" value={offerSalary} onChange={e => setOfferSalary(e.target.value)} />
              </div>
              <div>
                <label className="label">Expected Join Date (Optional)</label>
                <input type="date" className="input" value={offerJoinDate} onChange={e => setOfferJoinDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowOfferModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmHireWithOffer} disabled={actionLoading || !offerFile}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />}
                Confirm Hire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Confirm Rejection</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              This will move the candidate(s) to Rejected status and notify them respectfully via email. This action cannot be fully undone. Are you sure you wish to proceed?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-danger" onClick={() => actionTarget === "bulk" ? confirmBulkAction("reject") : (selected && updateStatus(selected.id, "Rejected").then(() => setShowRejectModal(false)))} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Confirm Deletion</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              This will permanently delete the application record and all attached files from the system. This action is completely irreversible. Are you sure?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-danger" onClick={() => actionTarget === "bulk" ? confirmBulkAction("delete") : confirmSingleDelete()} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={14} className="spin" /> : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
