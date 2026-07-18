"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Users, Trash2, X, Loader2, ClipboardList, _Edit2, LayoutDashboard } from "lucide-react";
import TasksClient from "../tasks/TasksClient";

type Team = {
  id: string; name: string; leadEmployeeId: string | null;
  members: { id: string; name: string; designation: string; employeeCode: string }[];
  tasks: { id: string; title: string; deadline: string }[];
  _count: { tasks: number; messages: number };
  createdAt: string;
};

type Employee = { id: string; name: string; employeeCode: string; designation: string; teamId: string | null };

export default function TeamsClient({ teams, employees, initialTasks = [] }: { teams: Team[]; employees: Employee[]; initialTasks?: any[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"teams" | "tasks">("teams");
  const [showCreate, setShowCreate] = useState(false);
  const [showAddTask, setShowAddTask] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskBrief, setTaskBrief] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskAttachments, setTaskAttachments] = useState<{name: string, data: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true); setMsg("");
    const res = await fetch("/api/company/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setNewTeamName(""); setShowCreate(false);
    startTransition(() => router.refresh());
  };

  const deleteTeam = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}"? Members will be unassigned.`)) return;
    setLoading(true);
    await fetch(`/api/company/teams/${id}`, { method: "DELETE" });
    setLoading(false);
    startTransition(() => router.refresh());
  };

  const setTeamLead = async (teamId: string, leadEmployeeId: string) => {
    setLoading(true);
    await fetch(`/api/company/teams/${teamId}/lead`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadEmployeeId: leadEmployeeId || null }),
    });
    setLoading(false);
    startTransition(() => router.refresh());
  };

  const addTask = async () => {
    if (!showAddTask || !taskTitle || !taskDeadline) return;
    setLoading(true); setMsg("");
    const res = await fetch("/api/company/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: showAddTask.id, title: taskTitle, brief: taskBrief, deadline: taskDeadline, createdBy: "Admin", attachments: taskAttachments }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setTaskTitle(""); setTaskBrief(""); setTaskDeadline(""); setTaskAttachments([]); setShowAddTask(null);
    startTransition(() => router.refresh());
  };

  return (
    <div>
      <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Workspace</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Command center for teams and operational tasks.</p>
        </div>
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", padding: 4, borderRadius: 8 }}>
          <button className={`btn btn-sm ${activeTab === "teams" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setActiveTab("teams")}>
            <Users size={14} /> Teams
          </button>
          <button className={`btn btn-sm ${activeTab === "tasks" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setActiveTab("tasks")}>
            <ClipboardList size={14} /> Tasks
          </button>
        </div>
      </div>

      {activeTab === "tasks" ? (
        <TasksClient initialTasks={initialTasks} teams={teams} employees={employees} hideHeader />
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Team
            </button>
          </div>

      {teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-wrapper">
            <Users size={28} />
          </div>
          <div className="empty-state-title">No teams found</div>
          <div className="empty-state-description">No teams yet. Create your first team.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
          {teams.map((team: any) => (
            <div key={team.id} className="card" style={{ padding: 24 }}>
              <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{team.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{team.members.length} members · {team._count.tasks} tasks</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTask(team)} title="Add task"><ClipboardList size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteTeam(team.id, team.name)} disabled={loading} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>

              {team.members.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Members</p>
                    <select 
                      className="input" 
                      style={{ padding: "4px 8px", fontSize: 11, height: "auto", width: "auto" }} 
                      value={team.leadEmployeeId || ""} 
                      onChange={e => setTeamLead(team.id, e.target.value)}
                      disabled={loading}
                    >
                      <option value="">No Lead Assigned</option>
                      {team.members.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {team.members.map((m: any) => (
                      <span key={m.id} style={{ fontSize: 12, padding: "4px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 999, border: "1px solid var(--border)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                        {m.name}
                        {team.leadEmployeeId === m.id && <span style={{ color: "var(--purple)", fontSize: 10, fontWeight: 700 }}>(Lead)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>No members assigned.</p>
              )}

              {team.tasks.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Tasks</p>
                  {team.tasks.map((t: any) => (
                    <div key={t.id} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "4px 0", borderTop: "1px solid var(--border-subtle)" }}>
                      {t.title} <span style={{ color: "var(--text-muted)" }}>· Due {format(new Date(t.deadline), "MMM d")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", padding: "clamp(16px, 5vw, 28px)" }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Create New Team</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label className="label label-required">Team Name</label>
                <input className="input" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Red Team Alpha" />
              </div>
              {msg && <p style={{ fontSize: 13, color: "var(--purple-light)" }}>{msg}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)} disabled={loading}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={createTeam} disabled={loading}>
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Create Team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: "clamp(16px, 5vw, 28px)" }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Task — {showAddTask.name}</h2>
              <button onClick={() => setShowAddTask(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label className="label label-required">Task Title</label>
                <input className="input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="e.g. Web App Pentest Report" />
              </div>
              <div>
                <label className="label">Task Brief / Description</label>
                <textarea className="input" value={taskBrief} onChange={e => setTaskBrief(e.target.value)} placeholder="Provide context and requirements..." style={{ minHeight: 90 }} />
              </div>
              <div>
                <label className="label label-required">Deadline</label>
                <input className="input" type="datetime-local" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} />
              </div>
              <div>
                <label className="label">Attachments (Optional)</label>
                <input type="file" multiple className="input" onChange={e => {
                  if (!e.target.files) return;
                  Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setTaskAttachments(prev => [...prev, { name: file.name, data: event.target?.result as string }]);
                    };
                    reader.readAsDataURL(file);
                  });
                }} />
                {taskAttachments.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {taskAttachments.map((att, i) => (
                      <span key={i} className="badge badge-gray">
                        {att.name}
                        <button type="button" onClick={() => setTaskAttachments(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", marginLeft: 4, cursor: "pointer", color: "var(--red)" }}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {msg && <p style={{ fontSize: 13, color: "var(--purple-light)" }}>{msg}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddTask(null)} disabled={loading}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={addTask} disabled={loading}>
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Add Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
