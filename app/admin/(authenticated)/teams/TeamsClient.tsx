"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Users, Trash2, X, Loader2, ClipboardList, Edit2 } from "lucide-react";

type Team = {
  id: string; name: string; leadEmployeeId: string | null;
  members: { id: string; name: string; designation: string; employeeCode: string }[];
  tasks: { id: string; title: string; deadline: string }[];
  _count: { tasks: number; messages: number };
  createdAt: string;
};

type Employee = { id: string; name: string; employeeCode: string; designation: string; teamId: string | null };

export default function TeamsClient({ teams, employees }: { teams: Team[]; employees: Employee[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddTask, setShowAddTask] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskBrief, setTaskBrief] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/teams", {
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
    await fetch(`/api/admin/teams/${id}`, { method: "DELETE" });
    setLoading(false);
    startTransition(() => router.refresh());
  };

  const addTask = async () => {
    if (!showAddTask || !taskTitle || !taskDeadline) return;
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: showAddTask.id, title: taskTitle, brief: taskBrief, deadline: taskDeadline, createdBy: "Admin" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setTaskTitle(""); setTaskBrief(""); setTaskDeadline(""); setShowAddTask(null);
    startTransition(() => router.refresh());
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Teams</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{teams.length} teams</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <Users size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>No teams yet. Create your first team.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
          {teams.map(team => (
            <div key={team.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
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
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Members</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {team.members.map(m => (
                      <span key={m.id} style={{ fontSize: 12, padding: "4px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 999, border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        {m.name}
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
                  {team.tasks.map(t => (
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
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
                <textarea className="input" value={taskBrief} onChange={e => setTaskBrief(e.target.value)} placeholder="Describe what needs to be submitted..." style={{ minHeight: 90 }} />
              </div>
              <div>
                <label className="label label-required">Deadline</label>
                <input className="input" type="datetime-local" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} />
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
  );
}
