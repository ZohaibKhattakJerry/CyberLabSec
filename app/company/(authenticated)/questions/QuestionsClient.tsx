"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, BookOpen, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";

type Question = {
  id: string;
  category: string;
  difficulty: string;
  type: string;
  prompt: string;
  options: string;
  correctOption: number | null;
  rubric: string | null;
  keywords: string;
  points: number;
  createdAt: string;
};

const CATEGORIES = ["web", "network", "pentest", "osint", "crypto", "soc_ir", "malware", "general"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const EMPTY_FORM = {
  category: "web",
  difficulty: "Medium",
  type: "open",
  prompt: "",
  options: "[]",
  correctOption: 0,
  rubric: "",
  keywords: "",
  points: 10,
};

export default function QuestionsClient({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // MCQ options helper
  const [optionsList, setOptionsList] = useState<string[]>(["", "", "", ""]);

  const openCreate = () => {
    setEditQ(null);
    setForm(EMPTY_FORM);
    setOptionsList(["", "", "", ""]);
    setMsg("");
    setShowForm(true);
  };

  const openEdit = (q: Question) => {
    setEditQ(q);
    let opts: string[] = [];
    try { opts = JSON.parse(q.options); } catch { opts = []; }
    while (opts.length < 4) opts.push("");
    setOptionsList(opts);
    setForm({
      category: q.category,
      difficulty: q.difficulty,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctOption: q.correctOption ?? 0,
      rubric: q.rubric || "",
      keywords: q.keywords,
      points: q.points,
    });
    setMsg("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.prompt.trim()) { setMsg("Question prompt is required."); return; }
    if (form.type === "mcq" && optionsList.filter(Boolean).length < 2) { setMsg("At least 2 options required for MCQ."); return; }
    setLoading(true); setMsg("");

    const payload = {
      ...form,
      options: form.type === "mcq" ? JSON.stringify(optionsList.filter(Boolean)) : "[]",
    };

    const url = editQ ? `/api/company/questions/${editQ.id}` : "/api/company/questions";
    const method = editQ ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed to save question"); return; }
    setShowForm(false);
    startTransition(() => router.refresh());
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/company/questions/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  const filtered = questions.filter((q) => {
    const matchSearch = q.prompt.toLowerCase().includes(search.toLowerCase()) || q.category.includes(search.toLowerCase());
    const matchType = typeFilter === "All" || q.type === typeFilter;
    const matchCat = catFilter === "All" || q.category === catFilter;
    return matchSearch && matchType && matchCat;
  });

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const openCount = questions.filter((q) => q.type === "open").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Question Bank</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {questions.length} questions — {mcqCount} MCQ · {openCount} Open-ended
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Question</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Questions", value: questions.length, color: "var(--purple)" },
          { label: "MCQ", value: mcqCount, color: "var(--blue)" },
          { label: "Open-ended", value: openCount, color: "var(--green)" },
          { label: "Categories", value: new Set(questions.map((q) => q.category)).size, color: "var(--amber)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input className="input" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 140 }}>
          <option value="All">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="open">Open-ended</option>
        </select>
        <select className="input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: 160 }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <BookOpen size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No questions found. Add your first question to build the interview bank.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((q) => (
            <div key={q.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <span className={`badge ${q.type === "mcq" ? "badge-blue" : "badge-green"}`} style={{ flexShrink: 0 }}>
                  {q.type.toUpperCase()}
                </span>
                <span className={`badge badge-gray`} style={{ flexShrink: 0, fontSize: 10 }}>{q.category}</span>
                <span className={`badge ${q.difficulty === "Easy" ? "badge-green" : q.difficulty === "Hard" ? "badge-red" : "badge-amber"}`} style={{ flexShrink: 0, fontSize: 10 }}>
                  {q.difficulty}
                </span>
                <p style={{ flex: 1, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {q.prompt}
                </p>
                <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 700, flexShrink: 0 }}>{q.points} pts</span>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(q); }}><Edit2 size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}><Trash2 size={13} /></button>
                </div>
                {expandedId === q.id ? <ChevronUp size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} /> : <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              </div>

              {expandedId === q.id && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 16, lineHeight: 1.6 }}>{q.prompt}</p>
                  {q.type === "mcq" && (() => {
                    let opts: string[] = [];
                    try { opts = JSON.parse(q.options); } catch { opts = []; }
                    return (
                      <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                        {opts.map((opt, i) => (
                          <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: i === q.correctOption ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === q.correctOption ? "rgba(34,197,94,0.3)" : "var(--border-subtle)"}`, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ width: 20, height: 20, borderRadius: "50%", background: i === q.correctOption ? "var(--green)" : "rgba(255,255,255,0.05)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {q.rubric && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(168,85,247,0.06)", borderRadius: 8, border: "1px solid rgba(168,85,247,0.15)" }}>
                      <div style={{ fontSize: 11, color: "var(--purple)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grading Rubric</div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{q.rubric}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflowY: "auto" }}>
          <div className="card" style={{ maxWidth: 640, width: "100%", padding: 32, margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editQ ? "Edit Question" : "Add Question"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="open">Open-ended</option>
                  <option value="mcq">Multiple Choice (MCQ)</option>
                </select>
              </div>
              <div>
                <label className="label">Points</label>
                <input className="input" type="number" min={1} max={100} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label className="label label-required">Question / Prompt</label>
                <textarea className="input" rows={4} value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} placeholder="Write the question here..." />
              </div>

              {form.type === "mcq" && (
                <>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="label">Answer Options</label>
                    <div style={{ display: "grid", gap: 8 }}>
                      {optionsList.map((opt, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: form.correctOption === i ? "var(--green)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: "pointer", border: `2px solid ${form.correctOption === i ? "var(--green)" : "var(--border)"}` }} onClick={() => setForm((f) => ({ ...f, correctOption: i }))}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <input className="input" value={opt} placeholder={`Option ${String.fromCharCode(65 + i)}`} onChange={(e) => { const l = [...optionsList]; l[i] = e.target.value; setOptionsList(l); }} style={{ flex: 1 }} />
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Click the letter circle to mark the correct answer.</p>
                  </div>
                </>
              )}

              {form.type === "open" && (
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="label">Grading Rubric (for AI scoring)</label>
                  <textarea className="input" rows={3} value={form.rubric} onChange={(e) => setForm((f) => ({ ...f, rubric: e.target.value }))} placeholder="Describe what a good answer should include (keywords, concepts, depth)..." />
                </div>
              )}

              <div style={{ gridColumn: "1/-1" }}>
                <label className="label">Keywords (comma-separated, for auto-selection)</label>
                <input className="input" value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="e.g. sql injection, xss, owasp, web" />
              </div>
            </div>

            {msg && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, marginTop: 16, fontSize: 14 }}>{msg}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 size={14} className="spin" /> : editQ ? "Save Changes" : "Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
