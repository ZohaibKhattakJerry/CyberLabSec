"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Filter, X, Eye, UserCheck, UserX, Loader2, FileText, ChevronRight, Check, AlertTriangle, Clock, Star, CheckSquare, Square } from "lucide-react";
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
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [offerNotes, setOfferNotes] = useState("");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(a => a.id));
  };

  const handleBulkAction = async (action: "reject" | "delete") => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Are you sure you want to completely delete ${selectedIds.length} application(s)? This cannot be undone.`)) return;
    if (action === "reject" && !confirm(`Are you sure you want to reject ${selectedIds.length} application(s)? They will receive a rejection email.`)) return;
    
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
    if (!confirm(`Are you sure you want to completely delete this application? This cannot be undone.`)) return;
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
    setActionMsg("Uploading offer letter...");
    
    try {
      const uploadRes = await fetch('/api/upload?filename=' + encodeURIComponent(offerFile.name), {
        method: "POST",
        body: offerFile
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
      const offerLetterUrl = uploadData.url;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = (reader.result as string).split(',')[1];
        
        setActionMsg("Finalizing hire...");
        const res = await fetch(`/api/company/applications/${selected.id}/hire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerLetterBase64: base64Str,
            offerLetterUrl,
            customMessage: offerNotes
          })
        });
        const data = await res.json();
        setActionLoading(false);
        if (!res.ok) { setActionMsg(data.error || "Failed to hire candidate"); return; }
        
        setShowOfferModal(false);
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, zIndex: 9999 });
        
        setActionMsg(`Candidate successfully hired! 🎉`);
        startTransition(() => { 
          router.refresh(); 
          setSelected({...selected, status: "Hired"});
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
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: 600, width: "100%" }}>
        {PIPELINE_STAGES.map(stage => {
          const items = filtered.filter(a => a.status === stage);
          return (
            <div 
              key={stage} 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => handleDrop(e, stage)}
              style={{ flex: "0 0 320px", background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 12, height: "max-content", minHeight: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{stage}</h3>
                <span className={`badge ${STATUS_COLORS[stage]}`}>{items.length}</span>
              </div>
              
              {items.length === 0 ? (
                <div className="empty-state empty-state-sm">
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
                    className={`card ${selectedIds.includes(a.id) ? 'selected' : ''}`} 
                    style={{ padding: 16, width: "100%", cursor: "grab", transition: "transform 0.1s", position: "relative", border: selectedIds.includes(a.id) ? "1px solid var(--purple)" : "1px solid var(--border)" }} 
                    onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.checkbox-container')) return;
                    setSelected(a);
                    setNotesDraft(a.privateNotes || "");
                    setRatingDraft(a.internalRating || 0);
                  }}>
                    <div className="checkbox-container" style={{ position: "absolute", top: 12, right: 12, color: selectedIds.includes(a.id) ? "var(--purple)" : "var(--text-muted)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); toggleSelect(a.id); }}>
                      {selectedIds.includes(a.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, paddingRight: 24 }}>{a.fullName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{a.jobPosting.title}</div>
                    
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
                <td data-label="Select" onClick={() => toggleSelect(a.id)} style={{ cursor: "pointer", color: selectedIds.includes(a.id) ? "var(--purple)" : "var(--text-muted)" }}>
                  {selectedIds.includes(a.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                </td>
                <td data-label="Applicant">
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.fullName}</div>
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
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(a); setNotesDraft(a.privateNotes || ""); setRatingDraft(a.internalRating || 0); }}><Eye size={13} /> View</button>
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

      {selectedIds.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--bg-elevated)", border: "1px solid var(--purple)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center", width: "calc(100% - 32px)", maxWidth: "max-content", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, color: "var(--purple)" }}>{selectedIds.length}</span>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>selected</span>
          </div>
          <div style={{ width: 1, height: 24, background: "var(--border)" }} />
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAction("reject")} disabled={actionLoading} style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>
              {actionLoading ? <Loader2 size={14} className="spin" /> : "Bulk Reject"}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleBulkAction("delete")} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={14} className="spin" /> : "Bulk Delete"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])} disabled={actionLoading}>Cancel</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 700, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selected.fullName}</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{selected.email} · {selected.phone}</p>
              </div>
              <button onClick={() => { setSelected(null); setActionMsg(""); setNotesDraft(""); setRatingDraft(0); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
              {PIPELINE_STAGES.map((stage, i) => {
                const isActive = selected.status === stage;
                const isPast = PIPELINE_STAGES.indexOf(selected.status) > i;
                return (
                  <div key={stage} style={{ display: "flex", alignItems: "center", gap: 8, opacity: isPast ? 0.7 : 1 }}>
                    <button 
                      onClick={() => updateStatus(selected.id, stage)}
                      className={`badge ${isActive ? STATUS_COLORS[stage] : isPast ? "badge-gray" : "badge-gray"}`}
                      style={{ cursor: "pointer", border: isActive ? "1px solid var(--purple)" : "none", padding: "6px 12px" }}
                    >
                      {isPast && <Check size={12} style={{ marginRight: 4, display: "inline" }} />}
                      {stage}
                    </button>
                    {i < PIPELINE_STAGES.length - 1 && <ChevronRight size={14} color="var(--text-muted)" />}
                  </div>
                );
              })}
            </div>

            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Position</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.jobPosting.title}</div>
              </div>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Applied</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{safeFormatDate(selected.createdAt, "MMM d, yyyy")}</div>
              </div>
            </div>

            <div style={{ marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Candidate Profile</h3>
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                {selected.city && <div><strong>City:</strong> {selected.city}</div>}
                {selected.universityName && <div><strong>University:</strong> {selected.universityName}</div>}
                {selected.linkedIn && <div><strong>LinkedIn:</strong> <a href={selected.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple)" }}>View Profile</a></div>}
                {selected.github && <div><strong>GitHub:</strong> <a href={selected.github} target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple)" }}>View GitHub</a></div>}
                {selected.portfolio && <div><strong>Portfolio:</strong> <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple)" }}>View Portfolio</a></div>}
                {selected.cve && <div><strong>CVEs:</strong> {selected.cve}</div>}
              </div>
            </div>

            {/* Motivation & Screening Answers */}
            {(selected.motivation || selected.degree || selected.bugBounty || selected.certifications) && (
              <div style={{ marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Motivation & Screening</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {selected.motivation && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>WHY CYBERLABSEC?</div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word", padding: "10px 14px", background: "rgba(168,85,247,0.05)", borderRadius: 8, borderLeft: "3px solid var(--purple)", margin: 0 }}>{selected.motivation}</p>
                    </div>
                  )}
                  <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                    {selected.degree && <div><strong>Degree:</strong> {selected.degree}</div>}
                    {selected.semester && <div><strong>Semester:</strong> {selected.semester}</div>}
                    {selected.cgpa && <div><strong>CGPA:</strong> {selected.cgpa}</div>}
                    {selected.bugBounty && <div><strong>Bug Bounty:</strong> <a href={selected.bugBounty} target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple)" }}>View Profile</a></div>}
                    {selected.certifications && <div style={{ gridColumn: "1/-1" }}><strong>Certs:</strong> {selected.certifications}</div>}
                    {selected.cnic && <div style={{ gridColumn: "1/-1" }}><strong>CNIC:</strong> {selected.cnic}</div>}
                  </div>
                </div>
              </div>
            )}

            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>AI Screening Score</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selected.fitScore !== null && selected.fitScore >= 70 ? "var(--green)" : "var(--amber)" }}>{selected.fitScore ?? "—"}%</div>
              </div>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Interview Score</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--purple)" }}>{selected.interviewSession?.totalScore ?? "—"}%</div>
              </div>
            </div>

            {selected.interviewSession && (
              <div style={{ marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Interview Details</h3>
                
                <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                    <Clock size={16} />
                    {selected.interviewSession.startedAt && selected.interviewSession.completedAt ? (
                      `${Math.round((new Date(selected.interviewSession.completedAt).getTime() - new Date(selected.interviewSession.startedAt).getTime()) / 60000)} mins spent`
                    ) : "Time unknown"}
                  </div>
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
                      return <div style={{ fontSize: 13, color: "var(--green)" }}><Check size={14} style={{ display: "inline", marginRight: 4 }} /> No integrity violations detected.</div>;
                    }

                    return (
                      <div>
                        <div style={{ fontSize: 13, color: "var(--amber)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} /> <strong>Integrity Flags Detected</strong>
                        </div>
                        <ul style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, paddingLeft: 20 }}>
                          {pasteAttempts > 0 && <li>{pasteAttempts} paste attempts</li>}
                          {tabBlurCount > 0 && <li>{tabBlurCount} tab switches</li>}
                          {violationList.map((v: any, i: number) => (
                            <li key={i}>{v.type ? `${v.type} (${v.count})` : JSON.stringify(v)}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  } catch (e) {
                    console.error(e);
                    return <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Failed to load integrity data.</div>;
                  }
                })()}
              </div>
            )}

            {selected.fitReasoning && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Screening Notes ({selected.fitScore}%)</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "14px", background: "rgba(147,51,234,0.05)", borderRadius: 8, borderLeft: "3px solid var(--purple)" }}>
                  {selected.fitReasoning}
                </p>
              </div>
            )}

            {/* Rating + Private Notes */}
            <div style={{ marginBottom: 20, padding: "16px", background: "rgba(168,85,247,0.04)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.12)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Internal Scorecard</h3>
              {/* Star rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", marginRight: 4 }}>Rating:</span>
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingDraft(star === ratingDraft ? 0 : star)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  >
                    <Star
                      size={20}
                      fill={(ratingDraft || selected.internalRating || 0) >= star ? "#f59e0b" : "none"}
                      color={(ratingDraft || selected.internalRating || 0) >= star ? "#f59e0b" : "var(--text-muted)"}
                    />
                  </button>
                ))}
                {(ratingDraft || selected.internalRating) ? (
                  <span style={{ fontSize: 12, color: "var(--amber)", marginLeft: 4 }}>{ratingDraft || selected.internalRating}/5</span>
                ) : <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>Not rated</span>}
              </div>
              {/* Private notes */}
              <textarea
                className="input"
                placeholder="Private notes (only visible to admins)…"
                style={{ minHeight: 80, fontSize: 13, resize: "vertical", marginBottom: 8 }}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
                onClick={saveNotes}
                disabled={notesSaving}
              >
                {notesSaving ? <Loader2 size={12} className="spin" /> : notesSaved ? <Check size={12} /> : <Star size={12} />}
                {notesSaved ? "Saved!" : "Save Notes & Rating"}
              </button>
            </div>

            {actionMsg && (
              <div style={{ marginBottom: 16, padding: "12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 13, color: "var(--green)" }}>
                {actionMsg}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 20 }}>
              {selected.status === "Selected – Waiting for Approval" ? (
                <>
                  <button className="btn btn-primary" onClick={() => hireApplicant(selected.id)} disabled={actionLoading} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}>
                    {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <UserCheck size={14} />}
                    Hire Candidate
                  </button>
                </>
              ) : selected.status === "Reviewing" ? (
                <button className="btn btn-primary" onClick={() => manualShortlist(selected.id)} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <UserCheck size={14} />}
                  Shortlist & Invite
                </button>
              ) : null}
              {(!["Rejected", "Hired", "Interview Failed", "Withdrawn"].includes(selected.status)) && (
                <button className="btn btn-secondary" onClick={() => updateStatus(selected.id, "Rejected")} disabled={actionLoading} style={{ color: "var(--amber)", borderColor: "var(--border-subtle)" }}>
                  <X size={14} /> Reject
                </button>
              )}
              <a href={`/api/files/${selected.id}/cv`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                <FileText size={14} /> View CV
              </a>
              {selected.status !== "Hired" && (
                <button 
                  className="btn btn-danger" 
                  style={{ marginLeft: "auto" }}
                  onClick={() => {
                    handleSingleDelete(selected.id);
                  }}
                  disabled={actionLoading}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Upload Offer Letter</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Please attach the signed offer letter (PDF). This will be emailed to the candidate and saved to their employee profile.
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
              style={{ minHeight: 80, marginBottom: 24, resize: "vertical" }}
              value={offerNotes}
              onChange={e => setOfferNotes(e.target.value)}
            />

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
    </div>
  );
}
