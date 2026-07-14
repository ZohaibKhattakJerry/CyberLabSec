"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, ChevronRight, FileText, CheckCircle, Clock, AlertTriangle, Star, X, Loader2, ExternalLink, Eye, Filter } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import toast from "react-hot-toast";

interface Submission {
  id: string;
  status: string;
  textResponse: string | null;
  linkResponse: string | null;
  files: string;
  summary: string | null;
  reviewerFeedback: string | null;
  qualityRating: number | null;
  submittedAt: string;
  version: number;
  employee: { id: string; name: string; employeeCode: string };
}

interface Task {
  id: string;
  title: string;
  brief: string;
  deadline: string;
  createdAt: string;
  priority: string;
  status: string;
  submissions: Submission[];
  team: { id: string; name: string };
}

interface Team {
  id: string;
  name: string;
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Low: { color: "var(--green)", bg: "rgba(34,197,94,0.1)", label: "Low" },
  Medium: { color: "var(--blue)", bg: "rgba(59,130,246,0.1)", label: "Medium" },
  High: { color: "var(--amber)", bg: "rgba(245,158,11,0.1)", label: "High" },
  Critical: { color: "var(--red)", bg: "rgba(239,68,68,0.1)", label: "Critical" },
};

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  Assigned: { badge: "badge-gray", label: "Assigned" },
  InProgress: { badge: "badge-blue", label: "In Progress" },
  Submitted: { badge: "badge-amber", label: "Submitted" },
  UnderReview: { badge: "badge-purple", label: "Under Review" },
  ChangesRequested: { badge: "badge-red", label: "Changes Requested" },
  Completed: { badge: "badge-green", label: "Completed" },
};

export default function TasksClient({ initialTasks, teams }: { initialTasks: Task[]; teams: Team[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<{ submissionId: string; action: "approve" | "request_changes" } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [qualityRating, setQualityRating] = useState(0);

  // Create form state
  const [form, setForm] = useState({ title: "", brief: "", deadline: "", teamId: "", priority: "Medium" });

  const filteredTasks = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.team.name.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    const matchPriority = filterPriority === "All" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.deadline || !form.teamId) return toast.error("Please fill all required fields");
    setLoading(true);
    try {
      const res = await fetch("/api/company/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const { task } = await res.json();
      setTasks([{ ...task, team: teams.find(t => t.id === form.teamId)!, submissions: [] }, ...tasks]);
      setShowCreate(false);
      setForm({ title: "", brief: "", deadline: "", teamId: "", priority: "Medium" });
      toast.success("Task assigned successfully");
    } catch {
      toast.error("Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewAction) return;
    if (reviewAction.action === "request_changes" && !feedback.trim()) {
      toast.error("Feedback is required when requesting changes");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/company/tasks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: reviewAction.submissionId, action: reviewAction.action, feedback: feedback.trim(), qualityRating: qualityRating || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(reviewAction.action === "approve" ? "Task approved — points awarded! 🎉" : "Changes requested — employee notified");
      setReviewAction(null);
      setFeedback("");
      setQualityRating(0);
      setReviewTask(null);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, gap: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Task Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Assign objectives, track progress, and review submissions.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={18} /> {showCreate ? "Cancel" : "Assign New Task"}
        </button>
      </div>

      {/* Create Task Panel */}
      {showCreate && (
        <div className="card animate-fade-up" style={{ padding: 28, marginBottom: 28, border: "1px solid var(--border-accent)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={18} color="var(--purple)" /> Create Operational Task
          </h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label className="label label-required">Task Title</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Initial Recon Report" required />
              </div>
              <div>
                <label className="label label-required">Assign to Team</label>
                <select className="input" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} required>
                  <option value="" disabled>Select a team...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Operational Briefing</label>
              <textarea className="input" value={form.brief} onChange={e => setForm({ ...form, brief: e.target.value })} placeholder="Detailed objectives, scope, and deliverables..." rows={4} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label className="label label-required">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label label-required">Deadline</label>
                <input type="datetime-local" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Deploying...</> : "Deploy Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }} />
          <input className="input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input" style={{ width: 140 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <div className="badge badge-gray" style={{ padding: "6px 12px", whiteSpace: "nowrap" }}>{filteredTasks.length} tasks</div>
      </div>

      {/* Task List */}
      <div style={{ display: "grid", gap: 12 }}>
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <FileText size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No tasks found matching your filters.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = isPast(new Date(task.deadline)) && task.status !== "Completed";
            const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
            const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.Assigned;
            const pendingSubmissions = task.submissions.filter(s => s.status === "Pending" || s.status === "Under Review");

            return (
              <div key={task.id} className="card" style={{ padding: 20, borderLeft: `3px solid ${pc.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: pc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isOverdue ? <AlertTriangle size={20} color={pc.color} /> : <FileText size={20} color={pc.color} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{task.title}</h3>
                      <span className={`badge ${sc.badge}`}>{sc.label}</span>
                      <span className="badge" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.color}40` }}>{pc.label}</span>
                      {isOverdue && <span className="badge badge-red">Overdue</span>}
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <FileText size={12} /> {task.team.name}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: isOverdue ? "var(--red)" : "inherit" }}>
                        <Clock size={12} /> Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={12} /> {task.submissions.length} submission{task.submissions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {pendingSubmissions.length > 0 && (
                      <span className="badge badge-amber" style={{ padding: "4px 8px" }}>{pendingSubmissions.length} to review</span>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setReviewTask(reviewTask?.id === task.id ? null : task)}
                    >
                      <Eye size={14} /> {reviewTask?.id === task.id ? "Close" : "Review"}
                    </button>
                  </div>
                </div>

                {/* Submissions Panel */}
                {reviewTask?.id === task.id && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
                    {task.submissions.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No submissions yet.</p>
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {task.submissions.map(sub => (
                          <div key={sub.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{sub.employee.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub.employee.employeeCode} · Submitted {format(new Date(sub.submittedAt), "MMM d, h:mm a")} · v{sub.version}</div>
                              </div>
                              <span className={`badge ${STATUS_CONFIG[sub.status]?.badge || "badge-gray"}`}>{STATUS_CONFIG[sub.status]?.label || sub.status}</span>
                            </div>

                            {sub.summary && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Work Summary</div>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{sub.summary}</p>
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                              {sub.linkResponse && (
                                <a href={sub.linkResponse} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                  <ExternalLink size={13} /> View Work
                                </a>
                              )}
                              {(() => {
                                try {
                                  const files = JSON.parse(sub.files);
                                  return files.length > 0 ? (
                                    <span className="badge badge-gray" style={{ padding: "5px 10px" }}>{files.length} file{files.length > 1 ? "s" : ""} attached</span>
                                  ) : null;
                                } catch { return null; }
                              })()}
                            </div>

                            {sub.reviewerFeedback && (
                              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--amber)", marginBottom: 4 }}>Previous Feedback</div>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{sub.reviewerFeedback}</p>
                              </div>
                            )}

                            {(sub.status === "Pending" || sub.status === "Under Review") && (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.3)" }}
                                  onClick={() => { setReviewAction({ submissionId: sub.id, action: "approve" }); setFeedback(""); setQualityRating(0); }}
                                >
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => { setReviewAction({ submissionId: sub.id, action: "request_changes" }); setFeedback(""); setQualityRating(0); }}
                                >
                                  Request Changes
                                </button>
                              </div>
                            )}

                            {/* Review Action Panel */}
                            {reviewAction?.submissionId === sub.id && (
                              <div style={{ marginTop: 12, padding: 16, background: "rgba(168,85,247,0.05)", border: "1px solid var(--border-accent)", borderRadius: 10 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                                  {reviewAction.action === "approve" ? "✅ Approve Submission" : "🔄 Request Changes"}
                                </div>

                                {reviewAction.action === "approve" && (
                                  <div style={{ marginBottom: 12 }}>
                                    <label className="label">Quality Rating (affects bonus points)</label>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setQualityRating(star === qualityRating ? 0 : star)}
                                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                                        >
                                          <Star size={24} fill={star <= qualityRating ? "var(--amber)" : "none"} color={star <= qualityRating ? "var(--amber)" : "var(--text-muted)"} />
                                        </button>
                                      ))}
                                      {qualityRating > 0 && <span style={{ fontSize: 13, color: "var(--amber)", alignSelf: "center" }}>+{qualityRating * 5} bonus pts</span>}
                                    </div>
                                  </div>
                                )}

                                <div style={{ marginBottom: 12 }}>
                                  <label className={`label ${reviewAction.action === "request_changes" ? "label-required" : ""}`}>
                                    {reviewAction.action === "approve" ? "Optional feedback" : "Feedback (required)"}
                                  </label>
                                  <textarea
                                    className="input"
                                    rows={3}
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder={reviewAction.action === "approve" ? "Great work! Specific notes..." : "What needs to be changed and why..."}
                                  />
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                  <button className="btn btn-secondary btn-sm" onClick={() => setReviewAction(null)}>Cancel</button>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleReview}
                                    disabled={loading || (reviewAction.action === "request_changes" && !feedback.trim())}
                                  >
                                    {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Submit Review"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
