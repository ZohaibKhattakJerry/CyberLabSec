import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, _RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface Question {
  id: string;
  category: string;
  difficulty: string;
  type: string;
  prompt: string;
  options: string;
  correctOption: number | null;
  rubric: string | null;
  points: number;
}

export default function QuestionBankTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState("open");
  const [category, setCategory] = useState("General");
  const [difficulty, setDifficulty] = useState("Medium");
  const [prompt, setPrompt] = useState("");
  const [rubric, setRubric] = useState("");
  const [points, setPoints] = useState(10);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company/questions");
      const data = await res.json();
      setQuestions(data);
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async () => {
    if (!prompt) return toast.error("Prompt is required");
    if (type === "mcq" && options.some(o => !o.trim())) return toast.error("All options must be filled");

    const payload = {
      type, category, difficulty, prompt, points,
      rubric: type === "open" ? rubric : null,
      options: type === "mcq" ? JSON.stringify(options) : "[]",
      correctOption: type === "mcq" ? correctOption : null,
    };

    try {
      const url = editingId ? `/api/company/questions/${editingId}` : "/api/company/questions";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? "Question updated" : "Question created");
        setShowModal(false);
        fetchQuestions();
      } else {
        toast.error("Failed to save question");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/company/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Question deleted");
        fetchQuestions();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setType(q.type);
    setCategory(q.category);
    setDifficulty(q.difficulty);
    setPrompt(q.prompt);
    setPoints(q.points);
    setRubric(q.rubric || "");
    try {
      setOptions(q.type === "mcq" ? JSON.parse(q.options) : ["", "", "", ""]);
    } catch {
      setOptions(["", "", "", ""]);
    }
    setCorrectOption(q.correctOption || 0);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingId(null);
    setType("open");
    setCategory("General");
    setDifficulty("Medium");
    setPrompt("");
    setRubric("");
    setPoints(10);
    setOptions(["", "", "", ""]);
    setCorrectOption(0);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={32} className="text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Question Bank Manager</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manage questions used for AI technical assessments.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew} style={{ gap: 8 }}>
          <Plus size={16} /> Add Question
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Prompt</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q: any) => (
              <tr key={q.id}>
                <td data-label="Type">
                  <span className="badge badge-gray">{q.type.toUpperCase()}</span>
                </td>
                <td data-label="Category">{q.category}</td>
                <td data-label="Difficulty">
                  <span className={`badge ${q.difficulty === "Easy" ? "badge-green" : q.difficulty === "Medium" ? "badge-amber" : "badge-red"}`}>{q.difficulty}</span>
                </td>
                <td data-label="Prompt" style={{ maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {q.prompt}
                </td>
                <td data-label="Actions" style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(q)} className="btn btn-ghost btn-sm"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(q.id)} className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <></>
            )}
          </tbody>
        </table>
        {questions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon-wrapper">
              <span style={{ fontSize: 28, fontWeight: 'bold' }}>?</span>
            </div>
            <div className="empty-state-title">No questions found</div>
            <div className="empty-state-description">Add some questions to the bank to get started.</div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24 }}>
          <div className="card" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{editingId ? "Edit Question" : "New Question"}</h2>
            
            <div style={{ display: "grid", gap: 20 }}>
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="open">Written / Open-ended</option>
                    <option value="mcq">Multiple Choice</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="General">General</option>
                    <option value="Web Security">Web Security</option>
                    <option value="Networking">Networking</option>
                    <option value="Linux">Linux</option>
                    <option value="Cryptography">Cryptography</option>
                    <option value="OSINT">OSINT</option>
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label label-required">Prompt</label>
                <textarea className="input" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Question text..." />
              </div>

              {type === "mcq" ? (
                <div>
                  <label className="label label-required">Options</label>
                  <div style={{ display: "grid", gap: 12 }}>
                    {options.map((opt: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input type="radio" checked={correctOption === idx} onChange={() => setCorrectOption(idx)} style={{ accentColor: "var(--purple)", width: 18, height: 18 }} />
                        <input className="input" style={{ flex: 1 }} value={opt} onChange={e => {
                          const newOpts = [...options];
                          newOpts[idx] = e.target.value;
                          setOptions(newOpts);
                        }} placeholder={`Option ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label">Rubric / Answer Guidelines</label>
                  <textarea className="input" rows={3} value={rubric} onChange={e => setRubric(e.target.value)} placeholder="Keywords or concepts AI should look for..." />
                </div>
              )}

              <div>
                <label className="label">Points</label>
                <input className="input" type="number" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
