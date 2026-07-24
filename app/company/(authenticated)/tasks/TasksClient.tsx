"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, ChevronRight, FileText, CheckCircle, Clock, AlertTriangle, Star, X, Loader2, ExternalLink, Eye, Filter, LayoutList, LayoutGrid, Globe, Target, ShieldAlert, Trash2 } from "lucide-react";
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
  employee: { id: string; name: string; employeeCode: string; photoUrl?: string };
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
  team: { 
    id: string; 
    name: string;
    members?: { id: string; name: string; employeeCode: string; photoUrl?: string }[];
  };
  targetUrl?: string | null;
  scopeRules?: string | null;
  vulnFocus?: string | null;
}

interface Team {
  id: string;
  name: string;
  members?: { id: string; name: string; employeeCode: string; photoUrl?: string }[];
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
  ChangesRequested: { badge: "badge-red", label: "Need more information" },
  Completed: { badge: "badge-green", label: "Completed" },
};

export default function TasksClient({ initialTasks, teams, employees, hideHeader = false, initialShowCreate = false, initialTeamId = null }: { initialTasks: Task[]; teams: Team[]; employees: any[]; hideHeader?: boolean; initialShowCreate?: boolean; initialTeamId?: string | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showCreate, setShowCreate] = useState(initialShowCreate);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<{ submissionId: string; action: "approve" | "request_changes" } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [qualityRating, setQualityRating] = useState(0);

  // Create form state
  const [form, setForm] = useState({ title: "", brief: "", deadline: "", teamId: initialTeamId || "", assigneeId: "", priority: "Medium", assignType: initialTeamId ? "Team" : "Team", targetUrl: "", scopeRules: "", vulnFocus: "" });
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checklistInput, setChecklistInput] = useState("");
  const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);

  const filteredTasks = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.team?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    const matchPriority = filterPriority === "All" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task? All submissions will be permanently deleted.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/company/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.deadline || (form.assignType === "Team" && !form.teamId) || (form.assignType === "Individual" && !form.assigneeId)) {
      return toast.error("Please fill all required fields");
    }
    setLoading(true);
    try {
      const selectedEmp = form.assignType === "Individual" ? employees.find(e => e.id === form.assigneeId) : null;
      const payload = {
        ...form,
        teamId: form.assignType === "Team" ? form.teamId : (selectedEmp?.teamId || form.teamId || null),
        assigneeId: form.assignType === "Individual" ? form.assigneeId : undefined,
        checklist: checklistItems,
        attachments
      };
      const res = await fetch("/api/company/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const { task } = await res.json();
      
      const newTeam = form.assignType === "Team" ? teams.find(t => t.id === form.teamId) : employees.find(e => e.id === form.assigneeId)?.teamId ? teams.find(t => t.id === employees.find(e => e.id === form.assigneeId)?.teamId) : { id: "no-team", name: "Direct Assignment" };
      
      setTasks([{ ...task, team: newTeam || { id: "no-team", name: "Direct Assignment" }, submissions: [] }, ...tasks]);
      setShowCreate(false);
      setForm({ title: "", brief: "", deadline: "", teamId: "", assigneeId: "", priority: "Medium", assignType: "Team", targetUrl: "", scopeRules: "", vulnFocus: "" });
      setChecklistItems([]);
      setChecklistInput("");
      setAttachments([]);
      toast.success("Task assigned successfully");
    } catch {
      toast.error("Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewAction) return;
    if (reviewAction?.action === "request_changes" && !feedback.trim()) {
      toast.error("Feedback is required when requesting changes");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/company/tasks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: reviewAction.submissionId, action: reviewAction?.action, feedback: feedback.trim(), qualityRating: qualityRating || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(reviewAction?.action === "approve" ? "Task approved — points awarded! 🎉" : "More information requested — employee notified");
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
      <div className="flex-mobile-col" style={{ display: "flex", justifyContent: hideHeader ? "flex-end" : "space-between", alignItems: "flex-end", marginBottom: 32, gap: 20, flexWrap: "wrap" }}>
        {!hideHeader && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Task Management</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Assign objectives, track progress, and review submissions.</p>
          </div>
        )}
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
            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label className="label label-required">Task Title</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Initial Recon Report" required />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label className="label label-required">Assignment Target</label>
                  <select className="input" value={form.assignType} onChange={e => setForm({ ...form, assignType: e.target.value })}>
                    <option value="Team">Entire Team</option>
                    <option value="Individual">Individual Employee</option>
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label className="label label-required">{form.assignType === "Team" ? "Select Team" : "Select Employee"}</label>
                  {form.assignType === "Team" ? (
                    <select className="input" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} required>
                      <option value="" disabled>Select a team...</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  ) : (
                    <select className="input" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })} required>
                      <option value="" disabled>Select an employee...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Operational Briefing</label>
              <textarea className="input" value={form.brief} onChange={e => setForm({ ...form, brief: e.target.value })} placeholder="Detailed objectives, deliverables..." rows={3} />
            </div>

            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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

            {/* Attachments */}
            <div>
              <label className="label">Attachments (PDF/Images)</label>
              <input
                type="file"
                multiple
                className="input"
                accept="application/pdf,image/*"
                onChange={e => {
                  if (!e.target.files) return;
                  Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setAttachments(prev => [...prev, { name: file.name, url: ev.target!.result as string }]);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                  e.target.value = ''; // Reset input
                }}
              />
              {attachments.length > 0 && (
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {attachments.map((att, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{att.name}</span>
                      <button type="button" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
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
        {/* View toggle */}
        <div style={{ display: "flex", gap: 4, border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 3, background: "rgba(255,255,255,0.03)" }}>
          <button onClick={() => setViewMode("list")} style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: viewMode === "list" ? "rgba(168,85,247,0.2)" : "transparent", color: viewMode === "list" ? "var(--purple)" : "var(--text-muted)" }} title="List view">
            <LayoutList size={15} />
          </button>
          <button onClick={() => setViewMode("board")} style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: viewMode === "board" ? "rgba(168,85,247,0.2)" : "transparent", color: viewMode === "board" ? "var(--purple)" : "var(--text-muted)" }} title="Board view">
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(230px, 1fr))", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
          {(["Assigned", "In Progress", "Submitted", "Completed"] as const).map(col => {
            const colTasks = filteredTasks.filter(t =>
              col === "Assigned" ? t.status === "Assigned" :
              col === "In Progress" ? t.status === "In Progress" :
              col === "Submitted" ? ["Submitted", "Under Review", "Changes Requested"].includes(t.status) :
              t.status === "Completed"
            );
            const colColors: Record<string, string> = { Assigned: "var(--text-muted)", "In Progress": "var(--blue)", Submitted: "var(--amber)", Completed: "var(--green)" };
            return (
              <div key={col} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 14, border: "1px solid var(--border-subtle)", minHeight: 300 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: colColors[col] }}>{col}</span>
                  <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: 10, color: "var(--text-muted)" }}>{colTasks.length}</span>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {colTasks.map((task: any) => {
                    const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                    const overdue = isPast(new Date(task.deadline)) && task.status !== "Completed";
                    return (
                      <div key={task.id} className="card card-hover" style={{ padding: 12, cursor: "pointer", position: "relative" }} onClick={() => router.push(`/company/tasks/${task.id}`)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{task.title}</div>
                          <button onClick={(e) => handleDeleteTask(task.id, e)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }} title="Delete Task">
                            <Trash2 size={14} className="hover-red" />
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: pc.bg, color: pc.color }}>{task.priority}</span>
                          <span style={{ fontSize: 10, color: overdue ? "var(--red)" : "var(--text-muted)" }}>{overdue ? "⚠ Overdue" : format(new Date(task.deadline), "MMM d")}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{task.team?.name || "Individual Assigned"}</div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>No tasks</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task List (List view) */}
      {viewMode === "list" && (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredTasks.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <FileText size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No tasks found matching your filters.</p>
            </div>
          ) : (
            <>
            {filteredTasks.map((task: any) => {
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
                        <FileText size={12} /> {task.team?.name || "Individual Assigned"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: isOverdue ? "var(--red)" : "inherit" }}>
                        <Clock size={12} /> Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={12} /> {task.submissions?.length || 0} submission{(task.submissions?.length || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Security Fields Preview */}
                    {(task.targetUrl || task.vulnFocus) && (
                      <div style={{ display: "flex", gap: 16, marginTop: 10, padding: "8px 12px", background: "rgba(168,85,247,0.05)", borderRadius: 6, border: "1px solid rgba(168,85,247,0.15)" }}>
                        {task.targetUrl && (
                          <span style={{ fontSize: 12, color: "var(--purple)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Globe size={13} /> {task.targetUrl}
                          </span>
                        )}
                        {task.vulnFocus && (
                          <span style={{ fontSize: 12, color: "var(--purple)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Target size={13} /> {task.vulnFocus}
                          </span>
                        )}
                        {task.scopeRules && (
                          <span style={{ fontSize: 12, color: "var(--purple)", display: "flex", alignItems: "center", gap: 6 }} title={task.scopeRules}>
                            <ShieldAlert size={13} /> ROE Defined
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                      {pendingSubmissions.length > 0 && (
                        <span className="badge badge-amber" style={{ padding: "4px 8px" }}>{pendingSubmissions.length} to review</span>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setReviewTask(reviewTask?.id === task.id ? null : task)}
                      >
                        <Eye size={14} /> {reviewTask?.id === task.id ? "Close" : "Review"}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        title="Delete Task"
                        style={{ padding: "8px" }}
                      >
                        <Trash2 size={14} className="text-red" />
                      </button>
                    </div>
                </div>

                {/* Submissions Panel */}
                {reviewTask?.id === task.id && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Team Submissions</h4>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {task.submissions.length} of {task.team.members?.length || 0} submitted
                      </div>
                    </div>
                    
                    {(!task.team.members || task.team.members.length === 0) ? (
                      <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No members in this team.</p>
                    ) : (
                      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                        {task.team.members.map((member: any) => {
                          const sub = task.submissions.find(s => s.employee.id === member.id);
                          
                          return (
                            <div key={member.id} style={{ 
                              background: "rgba(255,255,255,0.02)", 
                              border: `1px solid ${sub ? 'var(--border-subtle)' : 'rgba(255,255,255,0.05)'}`, 
                              borderRadius: 10, 
                              padding: 16,
                              opacity: sub ? 1 : 0.6
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{member.name}</div>
                                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{member.employeeCode} {sub ? `· v${sub.version}` : ''}</div>
                                </div>
                                {sub ? (
                                  <span className={`badge ${STATUS_CONFIG[sub.status]?.badge || "badge-gray"}`}>{STATUS_CONFIG[sub.status]?.label || sub.status}</span>
                                ) : (
                                  <span className="badge badge-gray">Not Submitted</span>
                                )}
                              </div>

                              {sub ? (
                                <>
                                  {sub.summary && (
                                    <div style={{ marginBottom: 12 }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</div>
                                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{sub.summary}</p>
                                    </div>
                                  )}

                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                    {sub.linkResponse && (
                                      <a href={sub.linkResponse} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: "4px 8px", fontSize: 12 }}>
                                        <ExternalLink size={12} /> View Link
                                      </a>
                                    )}
                                    {(() => {
                                      try {
                                        const files = JSON.parse(sub.files);
                                        return files.map((file: any, i: number) => (
                                          <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: "4px 8px", fontSize: 12 }}>
                                            <ExternalLink size={12} /> {file.name || `File ${i + 1}`}
                                          </a>
                                        ));
                                      } catch { return null; }
                                    })()}
                                  </div>

                                  {sub.reviewerFeedback && (
                                    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--amber)", marginBottom: 4 }}>Feedback</div>
                                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{sub.reviewerFeedback}</p>
                                    </div>
                                  )}

                                  {(sub.status === "Pending" || sub.status === "Under Review") && (
                                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                                      <button
                                        className="btn btn-sm"
                                        style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.3)", flex: 1, justifyContent: "center" }}
                                        onClick={() => { setReviewAction({ submissionId: sub.id, action: "approve" }); setFeedback(""); setQualityRating(0); }}
                                      >
                                        <CheckCircle size={14} /> Approve
                                      </button>
                                      <button
                                        className="btn btn-sm btn-secondary"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={() => { setReviewAction({ submissionId: sub.id, action: "request_changes" }); setFeedback(""); setQualityRating(0); }}
                                      >
                                        <AlertTriangle size={14} /> Need more information
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Review Action Panel */}
                                  {reviewAction?.submissionId === sub.id && (
                                    <div style={{ marginTop: 12, padding: 16, background: "rgba(168,85,247,0.05)", border: "1px solid var(--border-accent)", borderRadius: 10 }}>
                                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                                        {reviewAction?.action === "approve" ? "✅ Approve Submission" : "🔄 Need more information"}
                                      </div>

                                      {reviewAction?.action === "approve" && (
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
                                        <label className={`label ${reviewAction?.action === "request_changes" ? "label-required" : ""}`}>
                                          {reviewAction?.action === "approve" ? "Optional feedback" : "Feedback (required)"}
                                        </label>
                                        <textarea
                                          className="input"
                                          rows={3}
                                          value={feedback}
                                          onChange={e => setFeedback(e.target.value)}
                                          placeholder={reviewAction?.action === "approve" ? "Great work! Specific notes..." : "What needs to be changed and why..."}
                                        />
                                      </div>

                                      <div style={{ display: "flex", gap: 8 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setReviewAction(null)}>Cancel</button>
                                        <button
                                          className="btn btn-primary btn-sm"
                                          onClick={handleReview}
                                          disabled={loading || (reviewAction?.action === "request_changes" && !feedback.trim())}
                                        >
                                          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Submit Review"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, color: "var(--text-muted)", fontSize: 13, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                                  Waiting for submission
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </>
          )}
        </div>
      )}
    </div>
  );
}
