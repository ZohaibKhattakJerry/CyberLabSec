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
  assessmentSettings?: string; assessmentBank?: string; answerKey?: string;
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
  
  // Assessment Generation State
  const [genLoading, setGenLoading] = useState(false);
  const [mcqCount, setMcqCount] = useState(15);
  const [openCount, setOpenCount] = useState(5);

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

  const generateAssessment = async () => {
    if (!editPosting) return;
    setGenLoading(true);
    setMsg("");
    const res = await fetch(`/api/company/postings/${editPosting.id}/generate-assessment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mcqCount, openCount }),
    });
    const data = await res.json();
    setGenLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed to generate assessment"); return; }
    setMsg("Assessment generated successfully!");
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
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {postings.map((p: unknown) => (
            <div key={p.id} className="card card-hover" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, height: "100%", borderTop: `4px solid ${p.status === "Published" ? "var(--green)" : p.status === "Draft" ? "var(--text-muted)" : "var(--amber)"}` }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: "var(--text-primary)" }}>{p.title}</h3>
                  <span className={`badge ${p.status === "Published" ? "badge-green" : p.status === "Draft" ? "badge-gray" : "badge-amber"}`} style={{ flexShrink: 0, padding: "4px 8px" }}>{p.status}</span>
                </div>
                
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <span className={`badge ${p.type === "Job" ? "badge-blue" : "badge-purple"}`}>{p.type}</span>
                  <span className="badge badge-gray" style={{ background: "rgba(255,255,255,0.03)" }}>{p.department}</span>
                  <span className="badge badge-gray" style={{ background: "rgba(255,255,255,0.03)" }}>{p.location}</span>
                </div>

                <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={14} color="var(--purple)" /> <strong>{p._count.applicants}</strong> applicants
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Briefcase size={14} color="var(--blue)" /> Deadline: {format(new Date(p.deadline), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              
              <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /> Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deletePosting(p.id, p.title)} title="Delete"><Trash2 size={14} /></button>
                </div>
                {p.status !== "Draft" && (
                  <button className="btn btn-sm" onClick={() => toggleStatus(p)} title={p.status === "Published" ? "Close Posting" : "Publish"} style={{ background: p.status === "Published" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)", color: p.status === "Published" ? "var(--amber)" : "var(--green)", border: `1px solid ${p.status === "Published" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}` }}>
                    {p.status === "Published" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {p.status === "Published" ? "Close" : "Publish"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflowY: "auto" }}>
          <div className="card" style={{ maxWidth: 620, width: "100%", padding: 32, margin: "auto" }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
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

              {editPosting && (
                <>
                  <div style={{ gridColumn: "1/-1", marginTop: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--purple)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Dynamic Assessment Generation</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                      Auto-generate a rich pool of MCQs and Scenarios tailored strictly to this job's title, requirements, and experience level.
                    </p>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                      <div>
                        <label className="label">MCQ Count (Pool Size)</label>
                        <input className="input" type="number" min={5} max={50} value={mcqCount} onChange={e => setMcqCount(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="label">Scenario Count (Pool Size)</label>
                        <input className="input" type="number" min={1} max={10} value={openCount} onChange={e => setOpenCount(Number(e.target.value))} />
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={(e) => { e.preventDefault(); generateAssessment(); }} 
                        disabled={genLoading}
                        style={{ height: 42 }}
                      >
                        {genLoading ? <Loader2 size={16} className="spin" /> : "Generate Assessment"}
                      </button>
                    </div>
                    {editPosting.assessmentBank && editPosting.assessmentBank !== "[]" && (
                      <div style={{ marginTop: 16, padding: 12, background: "var(--bg-secondary)", borderRadius: 8, fontSize: 13, color: "var(--green)" }}>
                        ✅ Assessment Bank Generated! Current Pool Size: {JSON.parse(editPosting.assessmentBank).length} questions.
                      </div>
                    )}
                  </div>
                </>
              )}
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
