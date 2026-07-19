"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X, Loader2, Briefcase, ToggleLeft, ToggleRight, Edit2, Trash2, Users, ArrowRight, ArrowLeft } from "lucide-react";

type Posting = {
  id: string; title: string; type: string; department: string; location: string;
  description: string; requirements: string; 
  deadline: string; status: string; stipend: string;
  createdAt: string; _count: { applicants: number };
  assessmentBank?: string; answerKey?: string; assessmentSettings?: string;
};

const EMPTY_FORM = {
  title: "", type: "Job", department: "", location: "Remote",
  description: "", requirements: "", stipend: "",
  deadline: "", status: "Draft",
  universityRequired: false, showApplicantCount: true, autoShortlist: true,
  passMark: 50, openings: 1, experienceLevel: "Any", duration: "", weeklyHours: 40,
  niceToHave: "", whatYouGain: ""
};

export default function PostingsClient({ postings }: { postings: Posting[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [editPosting, setEditPosting] = useState<Posting | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  
  // Assessment State
  const [localAssessmentBank, setLocalAssessmentBank] = useState<any[]>([]);
  const [localAnswerKey, setLocalAnswerKey] = useState<any[]>([]);
  
  // Auto-Gen State
  const [genLoading, setGenLoading] = useState(false);
  const [autoGenMcqCount, setAutoGenMcqCount] = useState(5);
  const [autoGenOpenCount, setAutoGenOpenCount] = useState(2);

  // Manual Question Entry State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<"mcq" | "open">("mcq");
  const [newQuestionPrompt, setNewQuestionPrompt] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrectIndex, setNewQuestionCorrectIndex] = useState(0);
  const [newQuestionRubric, setNewQuestionRubric] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState(10);

  const openCreate = () => { 
    setEditPosting(null); 
    setForm(EMPTY_FORM); 
    setLocalAssessmentBank([]); 
    setLocalAnswerKey([]); 
    setMsg(""); 
    setStep(1);
    setShowForm(true); 
  };
  
  const openEdit = (p: Posting) => {
    setEditPosting(p);
    setForm({
      title: p.title, type: p.type, department: p.department, location: p.location,
      description: p.description, requirements: p.requirements,
      deadline: p.deadline.slice(0, 16),
      status: p.status,
      stipend: (p as any).stipend || "",
      universityRequired: (p as any).universityRequired ?? false,
      showApplicantCount: (p as any).showApplicantCount ?? true,
      autoShortlist: (p as any).autoShortlist ?? true,
      passMark: (p as any).passMark ?? 50,
      openings: (p as any).openings ?? 1,
      experienceLevel: (p as any).experienceLevel ?? "Any",
      duration: (p as any).duration ?? "",
      weeklyHours: (p as any).weeklyHours ?? 40,
      niceToHave: (p as any).niceToHave ?? "",
      whatYouGain: (p as any).whatYouGain ?? ""
    });
    setLocalAssessmentBank(p.assessmentBank && p.assessmentBank !== "[]" ? JSON.parse(p.assessmentBank) : []);
    setLocalAnswerKey(p.answerKey && p.answerKey !== "{}" ? JSON.parse(p.answerKey) : []);
    
    if (p.assessmentSettings && p.assessmentSettings !== "{}") {
      const settings = JSON.parse(p.assessmentSettings);
      setAutoGenMcqCount(settings.mcqCount || 5);
      setAutoGenOpenCount(settings.openCount || 2);
    } else {
      setAutoGenMcqCount(5);
      setAutoGenOpenCount(2);
    }
    
    setMsg(""); 
    setStep(1);
    setShowForm(true);
  };

  const handleSave = async (saveAsDraft = false) => {
    if (!form.title || !form.department || !form.deadline || !form.location) { setMsg("Title, department, location and deadline are required."); return; }
    if (!form.description.trim() || !form.requirements.trim()) { setMsg("Job description and requirements are required."); return; }
    setLoading(true); setMsg("");
    
    const payload = {
      ...form, 
      status: saveAsDraft ? "Draft" : (form.status === "Draft" ? "Published" : form.status),
      assessmentBank: JSON.stringify(localAssessmentBank),
      answerKey: JSON.stringify(localAnswerKey),
      assessmentSettings: JSON.stringify({ mcqCount: autoGenMcqCount, openCount: autoGenOpenCount })
    };
    
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
    setGenLoading(true);
    setMsg("");
    const res = await fetch(`/api/company/postings/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: form.title,
        type: form.type,
        department: form.department,
        location: form.location,
        deadline: form.deadline,
        description: form.description,
        requirements: form.requirements,
        niceToHave: form.niceToHave,
        whatYouGain: form.whatYouGain,
        experienceLevel: form.experienceLevel,
        openings: form.openings,
        duration: form.duration,
        weeklyHours: form.weeklyHours,
        universityRequired: form.universityRequired,
        autoShortlist: form.autoShortlist,
        stipend: form.stipend,
        count: autoGenMcqCount,
        openCount: autoGenOpenCount
      }),
    });
    const data = await res.json();
    setGenLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed to generate assessment"); return; }
    
    const newQuestions = data.map((q: any, i: number) => {
      const id = `ai_${Date.now()}_${i}`;
      const isMcq = q.type !== "OPEN";
      return {
        question: {
          id,
          type: isMcq ? "mcq" : "open",
          category: "ai-generated",
          difficulty: form.experienceLevel,
          prompt: q.question,
          points: 10,
          ...(isMcq ? { options: q.options || [] } : { rubric: q.rubric || "" })
        },
        answer: {
          questionId: id,
          ...(isMcq ? { correctOption: Array.isArray(q.options) ? q.options.indexOf(q.correctAnswer) : 0 } : {})
        }
      };
    });

    setLocalAssessmentBank(prev => [...prev, ...newQuestions.map((n: any) => n.question)]);
    setLocalAnswerKey(prev => [...prev, ...newQuestions.map((n: any) => n.answer)]);
    setMsg("Assessment questions added to the bank successfully!");
  };

  const handleAddManualQuestion = () => {
    if (!newQuestionPrompt.trim()) return setMsg("Question prompt is required.");
    const id = `man_${Date.now()}`;
    const question = {
      id,
      type: newQuestionType,
      category: "general",
      difficulty: "Medium",
      prompt: newQuestionPrompt,
      points: newQuestionPoints,
      ...(newQuestionType === "mcq" ? { options: newQuestionOptions } : {})
    };
    const answer = {
      questionId: id,
      ...(newQuestionType === "mcq" ? { correctOption: newQuestionCorrectIndex } : { rubric: newQuestionRubric })
    };
    
    setLocalAssessmentBank(prev => [...prev, question]);
    setLocalAnswerKey(prev => [...prev, answer]);
    
    // Reset form
    setNewQuestionPrompt("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionRubric("");
    setShowAddQuestion(false);
    setMsg("");
  };

  const handleDeleteQuestion = (id: string) => {
    setLocalAssessmentBank(prev => prev.filter(q => q.id !== id));
    setLocalAnswerKey(prev => prev.filter(a => a.questionId !== id));
  };

  const nextStep = () => {
    if (!form.title || !form.department || !form.deadline || !form.location) { setMsg("Title, department, location and deadline are required."); return; }
    if (!form.description.trim() || !form.requirements.trim()) { setMsg("Job description and requirements are required."); return; }
    setMsg("");
    setStep(2);
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
          {postings.map((p: any) => (
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

      {/* Create / Edit Modal (2-Step Wizard) */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflowY: "auto" }}>
          <div className="card" style={{ maxWidth: step === 1 ? 620 : 1000, width: "100%", padding: 32, margin: "auto", transition: "max-width 0.3s ease" }}>
            
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--purple)", marginBottom: 4 }}>
                  {step === 1 ? "Step 1: Job Details" : "Step 2: Jobs Bank"}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {step === 1 ? "Provide the fundamental details about this job posting." : "Manage MCQs and Scenario questions before publishing."}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
            </div>

            {msg && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{msg}</div>}

            {step === 1 ? (
              <>
                <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                  
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="label label-required">Job Description & Responsibilities</label>
                    <textarea className="input" rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Provide a detailed overview of the role, daily responsibilities, and team culture..." />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="label label-required">Requirements & Qualifications</label>
                    <textarea className="input" rows={4} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} placeholder="List required skills, minimum experience, desired certifications (OSCP, OSEP, etc.)..." />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="label">Nice to Have (Optional)</label>
                    <textarea className="input" rows={2} value={form.niceToHave as string} onChange={e => setForm(f => ({ ...f, niceToHave: e.target.value }))} placeholder="Bonus points for..." />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="label">What You'll Gain (Optional)</label>
                    <textarea className="input" rows={2} value={form.whatYouGain as string} onChange={e => setForm(f => ({ ...f, whatYouGain: e.target.value }))} placeholder="Perks, learning opportunities..." />
                  </div>
                  
                  <div>
                    <label className="label">Experience Level</label>
                    <select className="input" value={form.experienceLevel as string} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))}>
                      <option value="Any">Any</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Number of Openings</label>
                    <input className="input" type="number" min={1} value={form.openings as number} onChange={e => setForm(f => ({ ...f, openings: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Duration (Internship/Contract)</label>
                    <input className="input" value={form.duration as string} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 6 Months" />
                  </div>
                  <div>
                    <label className="label">Weekly Hours</label>
                    <input className="input" type="number" min={1} value={form.weeklyHours as number} onChange={e => setForm(f => ({ ...f, weeklyHours: parseInt(e.target.value) }))} />
                  </div>
                  
                  <div style={{ gridColumn: "1/-1", display: "flex", gap: 24, marginTop: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.universityRequired as boolean} onChange={e => setForm(f => ({ ...f, universityRequired: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "var(--purple)" }} />
                      University Degree Required
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.autoShortlist as boolean} onChange={e => setForm(f => ({ ...f, autoShortlist: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "var(--purple)" }} />
                      Auto-Shortlist / AI Interview Immediately
                    </label>
                  </div>
                  
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="label">Stipend / Salary (Optional)</label>
                    <input className="input" value={form.stipend} onChange={e => setForm(f => ({ ...f, stipend: e.target.value }))} placeholder="e.g. PKR 25,000 or Unpaid" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 32, justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => handleSave(true)} disabled={loading}>
                    {loading && form.status === "Draft" ? <Loader2 size={14} className="spin" /> : "Save as Draft"}
                  </button>
                  <button className="btn btn-primary" onClick={nextStep} style={{ padding: "0 24px" }}>
                    Continue to Job Bank <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
                  {/* Left Sidebar: Controls */}
                  <div>
                    <div style={{ background: "rgba(168,85,247,0.05)", padding: 20, borderRadius: 12, border: "1px dashed var(--purple)", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--purple)", marginBottom: 8 }}>Auto Generate</h3>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
                        Let AI instantly generate questions tailored to the job title and description.
                      </p>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label className="label" style={{ fontSize: 11 }}>MCQs</label>
                          <input className="input" type="number" min={0} value={autoGenMcqCount} onChange={e => setAutoGenMcqCount(Number(e.target.value))} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="label" style={{ fontSize: 11 }}>Open-Ended</label>
                          <input className="input" type="number" min={0} value={autoGenOpenCount} onChange={e => setAutoGenOpenCount(Number(e.target.value))} />
                        </div>
                      </div>
                      <button type="button" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={generateAssessment} disabled={genLoading}>
                        {genLoading ? <Loader2 size={16} className="spin" /> : "Generate"}
                      </button>
                    </div>

                    <button type="button" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", marginBottom: 24 }} onClick={() => setShowAddQuestion(!showAddQuestion)}>
                      <Plus size={14} /> {showAddQuestion ? "Cancel Manual Entry" : "Add Manual Question"}
                    </button>

                    <div style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 12 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Bank Summary</h4>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: "var(--text-secondary)" }}>Total Questions</span>
                        <span style={{ fontWeight: 700 }}>{localAssessmentBank.length}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: "var(--text-secondary)" }}>Total Points</span>
                        <span style={{ fontWeight: 700, color: "var(--green)" }}>{localAssessmentBank.reduce((sum, q) => sum + (q.points || 10), 0)}</span>
                      </div>
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                        <label className="label" style={{ fontSize: 11 }}>Passing Score (%)</label>
                        <input className="input" type="number" min={1} max={100} value={form.passMark} onChange={e => setForm(f => ({ ...f, passMark: Number(e.target.value) }))} />
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Applicants must score this percentage of total points or higher to pass.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Bank */}
                  <div>
                    {showAddQuestion && (
                      <div style={{ padding: 20, background: "var(--bg-secondary)", borderRadius: 12, marginBottom: 24, border: "1px solid var(--border-subtle)" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Create Manual Question</h3>
                        <div style={{ display: "grid", gap: 16 }}>
                          <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <label className="label">Question Type</label>
                              <select className="input" value={newQuestionType} onChange={(e) => setNewQuestionType(e.target.value as any)}>
                                <option value="mcq">Multiple Choice (MCQ)</option>
                                <option value="open">Open Ended / Scenario</option>
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label className="label">Points</label>
                              <input className="input" type="number" min={1} value={newQuestionPoints} onChange={e => setNewQuestionPoints(Number(e.target.value))} />
                            </div>
                          </div>
                          <div>
                            <label className="label">Question Prompt</label>
                            <textarea className="input" rows={2} value={newQuestionPrompt} onChange={e => setNewQuestionPrompt(e.target.value)} placeholder="Type the question here..." />
                          </div>
                          
                          {newQuestionType === "mcq" ? (
                            <div>
                              <label className="label">Options & Correct Answer</label>
                              <div style={{ display: "grid", gap: 8 }}>
                                {newQuestionOptions.map((opt, i) => (
                                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input type="radio" name="correctOpt" checked={newQuestionCorrectIndex === i} onChange={() => setNewQuestionCorrectIndex(i)} style={{ width: 16, height: 16, accentColor: "var(--green)" }} />
                                    <input className="input" style={{ flex: 1 }} value={opt} onChange={(e) => { const newOpts = [...newQuestionOptions]; newOpts[i] = e.target.value; setNewQuestionOptions(newOpts); }} placeholder={`Option ${i+1}`} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="label">Rubric / Ideal Answer</label>
                              <textarea className="input" rows={2} value={newQuestionRubric} onChange={e => setNewQuestionRubric(e.target.value)} placeholder="Describe what makes a good answer..." />
                            </div>
                          )}
                          <button type="button" className="btn btn-primary" onClick={handleAddManualQuestion} style={{ alignSelf: "flex-end" }}>Save Question</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gap: 12 }}>
                      {localAssessmentBank.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14, border: "2px dashed var(--border)", borderRadius: 12 }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                          Your Jobs Bank is empty.<br/>Use the tools on the left to add questions.
                        </div>
                      ) : (
                        localAssessmentBank.map((q, idx) => (
                          <div key={q.id} style={{ padding: 16, background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className={`badge ${q.type === 'mcq' ? 'badge-blue' : 'badge-amber'}`}>{q.type.toUpperCase()}</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Question {idx + 1}</span>
                                <span style={{ fontSize: 12, color: "var(--purple)", fontWeight: 600 }}>{q.points || 10} pts</span>
                              </div>
                              <button type="button" onClick={() => handleDeleteQuestion(q.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: 4 }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 12px 0", lineHeight: 1.5 }}>{q.prompt}</p>
                            
                            {q.type === "mcq" && q.options && (
                              <div style={{ display: "grid", gap: 6, marginLeft: 12 }}>
                                {q.options.map((opt: string, i: number) => {
                                  const ans = localAnswerKey.find(a => a.questionId === q.id);
                                  const isCorrect = ans && ans.correctOption === i;
                                  return (
                                    <div key={i} style={{ fontSize: 13, color: isCorrect ? "var(--green)" : "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isCorrect ? "var(--green)" : "var(--border)" }} />
                                      {opt}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {q.type === "open" && (
                              <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 6, borderLeft: "2px solid var(--border)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>Rubric:</strong> {localAnswerKey.find(a => a.questionId === q.id)?.rubric || "No rubric provided."}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 32, justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Back to Details
                  </button>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => handleSave(true)} disabled={loading}>
                      {loading && form.status === "Draft" ? <Loader2 size={14} className="spin" /> : "Save as Draft"}
                    </button>
                    <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={loading} style={{ background: "var(--green)", color: "#fff", border: "none", padding: "0 24px" }}>
                      {loading && form.status !== "Draft" ? <Loader2 size={14} className="spin" /> : editPosting && form.status !== "Draft" ? "Update Posting" : "Publish Posting"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
