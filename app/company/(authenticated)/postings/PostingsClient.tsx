"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X, Loader2, Briefcase, ToggleLeft, ToggleRight, Edit2, Trash2, Users } from "lucide-react";

type Posting = {
  id: string; title: string; type: string; department: string; location: string;
  description: string; requirements: string; universityRequired: boolean;
  deadline: string; status: string; passMark: number; showApplicantCount: boolean; autoShortlist: boolean;
  createdAt: string; _count: { applicants: number };
};

const EMPTY_FORM = {
  title: "", type: "Job", department: "", location: "Remote",
  description: "", requirements: "", niceToHave: "", whatYouGain: "",
  universityRequired: false, deadline: "", passMark: 60,
  showApplicantCount: true, status: "Draft", autoShortlist: true,
  experienceLevel: "Any", openings: 1,
  stipend: "", duration: "", weeklyHours: "",
};

export default function PostingsClient({ postings }: { postings: Posting[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editPosting, setEditPosting] = useState<Posting | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const openCreate = () => { setEditPosting(null); setForm(EMPTY_FORM); setMsg(""); setShowForm(true); };
  const openEdit = (p: Posting) => {
    setEditPosting(p);
    setForm({
      title: p.title, type: p.type, department: p.department, location: p.location,
      description: p.description, requirements: p.requirements,
      niceToHave: (p as unknown).niceToHave || "",
      whatYouGain: (p as unknown).whatYouGain || "",
      universityRequired: p.universityRequired, deadline: p.deadline.slice(0, 16),
      passMark: p.passMark, showApplicantCount: p.showApplicantCount ?? true, status: p.status, autoShortlist: p.autoShortlist ?? true,
      experienceLevel: (p as unknown).experienceLevel || "Any",
      openings: (p as unknown).openings || 1,
      stipend: (p as unknown).stipend || "",
      duration: (p as unknown).duration || "",
      weeklyHours: (p as unknown).weeklyHours || "",
    });
    setMsg(""); setShowForm(true);
  };

  const handleSave = async (saveAsDraft = false) => {
    if (!form.title || !form.department || !form.deadline || !form.location) { setMsg("Title, department, location and deadline are required."); return; }
    if (!form.description.trim() || !form.requirements.trim()) { setMsg("Job description and requirements are required."); return; }
    setLoading(true); setMsg("");
    
    const payload = { ...form, status: saveAsDraft ? "Draft" : (form.status === "Draft" ? "Published" : form.status) };
    
    const url = editPosting ? `/api/company/postings/${editPosting.id}` : "/api/company/postings";
    const method = editPosting ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setShowForm(false);
    startTransition(() => router.refresh());
  };

  const toggleStatus = async (p: Posting) => {
    const newStatus = p.status === "Published" ? "Closed" : "Published";
    await fetch(`/api/company/postings/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    startTransition(() => router.refresh());
  };

  const deletePosting = async (id: string, title: string) => {
    if (!confirm(`Delete posting "${title}"?`)) return;
    await fetch(`/api/company/postings/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <div>
      <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Job Postings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{postings.length} postings</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Posting</button>
      </div>

      {postings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-wrapper">
            <Briefcase size={28} />
          </div>
          <div className="empty-state-title">No job postings</div>
          <div className="empty-state-description">No job postings yet.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {postings.map((p: unknown) => (
            <div key={p.id} className="card flex-mobile-col" style={{ padding: 22, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</h3>
                  <span className={`badge ${p.status === "Published" ? "badge-green" : p.status === "Draft" ? "badge-gray" : "badge-amber"}`}>{p.status}</span>
                  <span className={`badge ${p.type === "Job" ? "badge-blue" : "badge-purple"}`}>{p.type}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                  <span>{p.department}</span>
                  <span>{p.location}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} /> {p._count.applicants} applicants</span>
                  <span>Deadline: {format(new Date(p.deadline), "MMM d, yyyy")}</span>
                  <span>Pass ≥ {p.passMark}%</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", width: "100%", justifyContent: "flex-start" }}>
                {p.status !== "Draft" && (
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(p)} title={p.status === "Published" ? "Close" : "Publish"} style={{ color: p.status === "Published" ? "var(--amber)" : "var(--green)" }}>
                    {p.status === "Published" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {p.status === "Published" ? "Close" : "Publish"}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                <button className="btn btn-danger btn-sm" onClick={() => deletePosting(p.id, p.title)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflowY: "auto" }}>
          <div className="card" style={{ maxWidth: 620, width: "100%", padding: 32, margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editPosting ? "Edit Posting" : "New Job Posting"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--purple)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Basic Information</h3>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Job Title</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Red Team Operator" />
              </div>
              <div>
                <label className="label label-required">Position Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Job">Full-time Job</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="label label-required">Department</label>
                <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Offensive Security" />
              </div>
              <div>
                <label className="label label-required">Location</label>
                <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Remote / Global" />
              </div>
              <div>
                <label className="label label-required">Application Deadline</label>
                <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              
              <div style={{ gridColumn: "1/-1", marginTop: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--purple)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Role Details</h3>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Job Description & Responsibilities</label>
                <textarea className="input" rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Provide a detailed overview of the role, daily responsibilities, and team culture..." />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Requirements & Qualifications</label>
                <textarea className="input" rows={5} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} placeholder="List required skills, minimum experience, desired certifications (OSCP, OSEP, etc.)..." />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label">Nice to Have (Optional)</label>
                <textarea className="input" rows={3} value={form.niceToHave} onChange={e => setForm(f => ({ ...f, niceToHave: e.target.value }))} placeholder="Bonus skills, preferred certifications, extra experience..." />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label">What You&apos;ll Gain (Benefits / Perks)</label>
                <textarea className="input" rows={3} value={form.whatYouGain} onChange={e => setForm(f => ({ ...f, whatYouGain: e.target.value }))} placeholder="Certificate, Letter of Recommendation, real client experience, mentorship..." />
              </div>

              <div style={{ gridColumn: "1/-1", marginTop: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--purple)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Compensation & Logistics</h3>
              </div>
              <div>
                <label className="label">Stipend / Salary</label>
                <input className="input" value={form.stipend} onChange={e => setForm(f => ({ ...f, stipend: e.target.value }))} placeholder="e.g. PKR 25,000 or Unpaid" />
              </div>
              <div>
                <label className="label">Duration</label>
                <input className="input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 months, 6 months" />
              </div>
              <div>
                <label className="label">Weekly Hours</label>
                <input className="input" type="number" min={1} max={60} value={form.weeklyHours} onChange={e => setForm(f => ({ ...f, weeklyHours: e.target.value }))} placeholder="e.g. 20" />
              </div>
              <div>
                <label className="label">Openings</label>
                <input className="input" type="number" min={1} value={form.openings} onChange={e => setForm(f => ({ ...f, openings: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Experience Level</label>
                <select className="input" value={form.experienceLevel} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))}>
                  <option value="Any">Any</option>
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead / Principal</option>
                </select>
              </div>
              <div>
                <label className="label" style={{ display: "flex", gap: 4, alignItems: "center" }}>Interview Pass Mark (%) <span className="tooltip"><span className="badge badge-gray" style={{ fontSize: 10, padding: "0 4px" }}>?</span><span className="tooltip-content">Minimum score required in technical interview</span></span></label>
                <input className="input" type="number" min={0} max={100} value={form.passMark} onChange={e => setForm(f => ({ ...f, passMark: Number(e.target.value) }))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="uniReq" checked={form.universityRequired} onChange={e => setForm(f => ({ ...f, universityRequired: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--purple)" }} />
                  <label htmlFor="uniReq" style={{ fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>University enrollment required (for internships)</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="showCount" checked={form.showApplicantCount} onChange={e => setForm(f => ({ ...f, showApplicantCount: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--purple)" }} />
                  <label htmlFor="showCount" style={{ fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>Show applicant count publicly</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="autoShortlist" checked={form.autoShortlist} onChange={e => setForm(f => ({ ...f, autoShortlist: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--purple)" }} />
                  <label htmlFor="autoShortlist" style={{ fontSize: 14, cursor: "pointer", color: "var(--text-secondary)" }}>Auto-shortlist via AI</label>
                </div>
              </div>
            </div>
            {msg && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, marginTop: 20, fontSize: 14 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleSave(true)} disabled={loading}>
                {loading && form.status === "Draft" ? <Loader2 size={14} className="spin" /> : "Save Draft"}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSave(false)} disabled={loading}>
                {loading && form.status !== "Draft" ? <Loader2 size={14} className="spin" /> : editPosting && form.status !== "Draft" ? "Save Changes" : "Publish Posting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
