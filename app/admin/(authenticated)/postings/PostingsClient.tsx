"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X, Loader2, Briefcase, ToggleLeft, ToggleRight, Edit2, Trash2, Users } from "lucide-react";

type Posting = {
  id: string; title: string; type: string; department: string; location: string;
  description: string; requirements: string; universityRequired: boolean;
  deadline: string; status: string; shortlistThreshold: number; passMark: number;
  createdAt: string; _count: { applicants: number };
};

const EMPTY_FORM = {
  title: "", type: "Job", department: "", location: "Remote",
  description: "", requirements: "", universityRequired: false,
  deadline: "", shortlistThreshold: 50, passMark: 60,
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
      universityRequired: p.universityRequired, deadline: p.deadline.slice(0, 16),
      shortlistThreshold: p.shortlistThreshold, passMark: p.passMark,
    });
    setMsg(""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.department || !form.deadline) { setMsg("Title, department and deadline are required."); return; }
    setLoading(true); setMsg("");
    const url = editPosting ? `/api/admin/postings/${editPosting.id}` : "/api/admin/postings";
    const method = editPosting ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setShowForm(false);
    startTransition(() => router.refresh());
  };

  const toggleStatus = async (p: Posting) => {
    const newStatus = p.status === "Open" ? "Closed" : "Open";
    await fetch(`/api/admin/postings/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    startTransition(() => router.refresh());
  };

  const deletePosting = async (id: string, title: string) => {
    if (!confirm(`Delete posting "${title}"?`)) return;
    await fetch(`/api/admin/postings/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Job Postings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{postings.length} postings</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Posting</button>
      </div>

      {postings.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>No job postings yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {postings.map((p: any) => (
            <div key={p.id} className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</h3>
                  <span className={`badge ${p.status === "Open" ? "badge-green" : "badge-gray"}`}>{p.status}</span>
                  <span className={`badge ${p.type === "Job" ? "badge-blue" : "badge-purple"}`}>{p.type}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16 }}>
                  <span>{p.department}</span>
                  <span>{p.location}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} /> {p._count.applicants} applicants</span>
                  <span>Deadline: {format(new Date(p.deadline), "MMM d, yyyy")}</span>
                  <span>Shortlist ≥ {p.shortlistThreshold}% · Pass ≥ {p.passMark}%</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(p)} title={p.status === "Open" ? "Close" : "Open"} style={{ color: p.status === "Open" ? "var(--amber)" : "var(--green)" }}>
                  {p.status === "Open" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {p.status === "Open" ? "Close" : "Open"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                <button className="btn btn-danger btn-sm" onClick={() => deletePosting(p.id, p.title)} disabled={p._count.applicants > 0}><Trash2 size={13} /></button>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Job Title</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Junior Penetration Tester" />
              </div>
              <div>
                <label className="label label-required">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Job">Job</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="label label-required">Department</label>
                <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Offensive Security" />
              </div>
              <div>
                <label className="label label-required">Location</label>
                <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Remote / Karachi" />
              </div>
              <div>
                <label className="label label-required">Application Deadline</label>
                <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="label">AI Shortlist Threshold (%)</label>
                <input className="input" type="number" min={0} max={100} value={form.shortlistThreshold} onChange={e => setForm(f => ({ ...f, shortlistThreshold: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Interview Pass Mark (%)</label>
                <input className="input" type="number" min={0} max={100} value={form.passMark} onChange={e => setForm(f => ({ ...f, passMark: Number(e.target.value) }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Job Description</label>
                <textarea className="input" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role, responsibilities..." />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Requirements</label>
                <textarea className="input" rows={4} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} placeholder="List required skills, experience..." />
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="uniReq" checked={form.universityRequired} onChange={e => setForm(f => ({ ...f, universityRequired: e.target.checked }))} />
                <label htmlFor="uniReq" style={{ fontSize: 14, cursor: "pointer" }}>University enrollment required (for internships)</label>
              </div>
            </div>
            {msg && <p style={{ fontSize: 13, color: "var(--purple-light)", marginTop: 14 }}>{msg}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : editPosting ? "Save Changes" : "Publish Posting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
