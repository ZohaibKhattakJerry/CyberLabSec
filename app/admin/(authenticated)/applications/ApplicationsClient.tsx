"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Filter, ChevronDown, X, Eye, UserCheck, UserX, Loader2, FileText } from "lucide-react";

type Applicant = {
  id: string; fullName: string; email: string; phone: string;
  status: string; fitScore: number | null; fitReasoning: string | null;
  createdAt: string; jobPostingId: string;
  jobPosting: { id: string; title: string; type: string };
  interviewSession: { id: string; totalScore: number | null; result: string | null; completedAt: string | null } | null;
};

type Posting = { id: string; title: string };

const STATUS_COLORS: Record<string, string> = {
  Applied: "badge-gray", Reviewing: "badge-amber", Shortlisted: "badge-blue",
  InterviewInvited: "badge-purple", Passed: "badge-green", Failed: "badge-purple",
  Rejected: "badge-purple", Hired: "badge-green", Blocked: "badge-purple",
};

export default function ApplicationsClient({ applicants, postings }: { applicants: Applicant[]; postings: Posting[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPosting, setFilterPosting] = useState("All");
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const filtered = applicants.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    const matchPosting = filterPosting === "All" || a.jobPostingId === filterPosting;
    return matchSearch && matchStatus && matchPosting;
  });

  const updateStatus = async (applicantId: string, status: string) => {
    setActionLoading(true); setActionMsg("");
    const res = await fetch(`/api/admin/applications/${applicantId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed"); return; }
    setActionMsg("Status updated.");
    startTransition(() => { router.refresh(); setSelected(null); });
  };

  const hireApplicant = async (applicantId: string) => {
    setActionLoading(true); setActionMsg("");
    const res = await fetch(`/api/admin/applications/${applicantId}/hire`, {
      method: "POST",
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setActionMsg(data.error || "Failed to create employee record"); return; }
    setActionMsg(`Employee created: ${data.employeeCode}`);
    startTransition(() => { router.refresh(); setSelected(null); });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Applications</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{applicants.length} total applications</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {["Applied","Reviewing","Shortlisted","InterviewInvited","Passed","Failed","Rejected","Hired","Blocked"].map((s: any) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input" style={{ width: 200 }} value={filterPosting} onChange={e => setFilterPosting(e.target.value)}>
          <option value="All">All Positions</option>
          {postings.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div className="badge badge-gray" style={{ alignSelf: "center", padding: "6px 12px" }}>{filtered.length} results</div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Position</th>
              <th>AI Score</th>
              <th>Interview</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: any) => (
              <tr key={a.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{a.fullName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{a.jobPosting.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.jobPosting.type}</div>
                </td>
                <td>
                  {a.fitScore !== null ? (
                    <span style={{ fontWeight: 700, color: a.fitScore >= 70 ? "var(--green)" : a.fitScore >= 50 ? "var(--amber)" : "var(--purple)" }}>
                      {a.fitScore}%
                    </span>
                  ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td>
                  {a.interviewSession ? (
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.interviewSession.result === "Passed" ? "var(--green)" : a.interviewSession.result === "Failed" ? "var(--purple)" : "var(--amber)" }}>
                        {a.interviewSession.result || "In Progress"}
                      </span>
                      {a.interviewSession.totalScore !== null && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.interviewSession.totalScore}%</div>
                      )}
                    </div>
                  ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                </td>
                <td><span className={`badge ${STATUS_COLORS[a.status] || "badge-gray"}`}>{a.status}</span></td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{format(new Date(a.createdAt), "MMM d, yyyy")}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(a)} style={{ gap: 6 }}>
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No applications match your filters.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 620, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selected.fullName}</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{selected.email} · {selected.phone}</p>
              </div>
              <button onClick={() => { setSelected(null); setActionMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                { l: "Position", v: selected.jobPosting.title },
                { l: "Type", v: selected.jobPosting.type },
                { l: "Status", v: <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span> },
                { l: "AI Fit Score", v: selected.fitScore !== null ? `${selected.fitScore}%` : "—" },
                { l: "Applied", v: format(new Date(selected.createdAt), "MMM d, yyyy h:mm a") },
                { l: "Interview Score", v: selected.interviewSession?.totalScore !== null && selected.interviewSession?.totalScore !== undefined ? `${selected.interviewSession.totalScore}%` : "—" },
              ].map((r: any) => (
                <div key={r.l} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{r.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{r.v}</div>
                </div>
              ))}
            </div>

            {selected.fitReasoning && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Screening Notes</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "2px solid var(--border-accent)" }}>
                  {selected.fitReasoning}
                </p>
              </div>
            )}

            {actionMsg && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 13, color: "var(--green)" }}>
                {actionMsg}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {selected.status === "Passed" && (
                <button className="btn btn-primary btn-sm" onClick={() => hireApplicant(selected.id)} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <UserCheck size={13} />}
                  Hire → Create Employee
                </button>
              )}
              {["Applied","Reviewing","InterviewInvited"].includes(selected.status) && (
                <button className="btn btn-danger btn-sm" onClick={() => updateStatus(selected.id, "Rejected")} disabled={actionLoading}>
                  <UserX size={13} /> Reject
                </button>
              )}
              {selected.status === "Reviewing" && (
                <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected.id, "Shortlisted")} disabled={actionLoading}>
                  Shortlist Manually
                </button>
              )}
              <a href={`/api/files/${selected.id}/cv`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <FileText size={13} /> View CV
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
