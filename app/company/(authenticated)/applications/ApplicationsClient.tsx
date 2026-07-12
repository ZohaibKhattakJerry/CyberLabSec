"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Filter, X, Eye, UserCheck, UserX, Loader2, FileText, ChevronRight, Check } from "lucide-react";

type Applicant = {
  id: string; fullName: string; email: string; phone: string;
  status: string; fitScore: number | null; fitReasoning: string | null;
  createdAt: string; jobPostingId: string;
  internalRating: number | null; privateNotes: string | null;
  jobPosting: { id: string; title: string; type: string };
  interviewSession: { id: string; totalScore: number | null; result: string | null; completedAt: string | null } | null;
};

type Posting = { id: string; title: string };

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected", "Withdrawn"];
const STATUS_COLORS: Record<string, string> = {
  Applied: "badge-gray", Screening: "badge-amber", Interview: "badge-purple",
  Offer: "badge-blue", Hired: "badge-green", Rejected: "badge-red", Withdrawn: "badge-gray",
};

export default function ApplicationsClient({ applicants, postings }: { applicants: Applicant[]; postings: Posting[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterPosting, setFilterPosting] = useState("All");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const filtered = applicants.filter(a => {
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
    setActionMsg("Status updated.");
    startTransition(() => { 
      router.refresh(); 
      if (selected) {
        setSelected({...selected, status: status});
      }
    });
  };

  const hireApplicant = async (applicantId: string) => {
    if (!confirm("Are you sure you want to hire this applicant? This will send a request to the CEO Review queue.")) return;
    setActionLoading(true); setActionMsg("");
    
    // Instead of auto-hiring, we push to CEO Review
    const res = await fetch(`/api/company/applications/${applicantId}/hire`, {
      method: "POST",
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed to submit for review"); return; }
    setActionMsg(`Submitted to CEO Review queue.`);
    startTransition(() => { router.refresh(); });
  };

  const renderKanban = () => {
    return (
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: 600 }}>
        {PIPELINE_STAGES.map(stage => {
          const items = filtered.filter(a => a.status === stage);
          return (
            <div key={stage} style={{ flex: "0 0 320px", background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{stage}</h3>
                <span className={`badge ${STATUS_COLORS[stage]}`}>{items.length}</span>
              </div>
              
              {items.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>No candidates</div>
              ) : (
                items.map(a => (
                  <div key={a.id} className="card" style={{ padding: 16, cursor: "pointer", transition: "transform 0.1s" }} onClick={() => setSelected(a)}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.fullName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{a.jobPosting.title}</div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {a.fitScore !== null ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: a.fitScore >= 70 ? "var(--green)" : a.fitScore >= 50 ? "var(--amber)" : "var(--purple)" }}>
                          AI Match: {a.fitScore}%
                        </span>
                      ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No Score</span>}
                      
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{format(new Date(a.createdAt), "MMM d")}</span>
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
              <tr key={a.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.fullName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{a.jobPosting.title}</div>
                </td>
                <td>
                  {a.fitScore !== null ? (
                    <span style={{ fontWeight: 700, color: a.fitScore >= 70 ? "var(--green)" : a.fitScore >= 50 ? "var(--amber)" : "var(--purple)" }}>
                      {a.fitScore}%
                    </span>
                  ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td><span className={`badge ${STATUS_COLORS[a.status] || "badge-gray"}`}>{a.status}</span></td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{format(new Date(a.createdAt), "MMM d, yyyy")}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(a)}><Eye size={13} /> View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
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
        <select className="input" style={{ width: 200 }} value={filterPosting} onChange={e => setFilterPosting(e.target.value)}>
          <option value="All">All Positions</option>
          {postings.map((p: Posting) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {viewMode === "kanban" ? renderKanban() : renderList()}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 700, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selected.fullName}</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{selected.email} · {selected.phone}</p>
              </div>
              <button onClick={() => { setSelected(null); setActionMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Position</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.jobPosting.title}</div>
              </div>
              <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Applied</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{format(new Date(selected.createdAt), "MMM d, yyyy")}</div>
              </div>
            </div>

            {selected.fitReasoning && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Screening Notes ({selected.fitScore}%)</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "14px", background: "rgba(147,51,234,0.05)", borderRadius: 8, borderLeft: "3px solid var(--purple)" }}>
                  {selected.fitReasoning}
                </p>
              </div>
            )}

            {actionMsg && (
              <div style={{ marginBottom: 16, padding: "12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 13, color: "var(--green)" }}>
                {actionMsg}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 20 }}>
              {selected.status === "Offer" && (
                <button className="btn btn-primary" onClick={() => hireApplicant(selected.id)} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <UserCheck size={14} />}
                  Hire & Request CEO Approval
                </button>
              )}
              <a href={`/api/files/${selected.id}/cv`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                <FileText size={14} /> View CV
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
