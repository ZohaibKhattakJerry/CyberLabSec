"use client";

import { useState } from "react";
import { Plus, Search, Calendar, ChevronRight, FileText, CheckCircle, Clock } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  brief: string;
  deadline: string;
  createdAt: string;
  submissions: any[];
  team: { id: string; name: string };
}

interface Team {
  id: string;
  name: string;
}

export default function TasksClient({ initialTasks, teams }: { initialTasks: Task[]; teams: Team[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [deadline, setDeadline] = useState("");
  const [teamId, setTeamId] = useState("");

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.team.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !teamId) return toast.error("Please fill all required fields");
    setLoading(true);

    try {
      const res = await fetch("/api/company/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, brief, deadline, teamId }),
      });

      if (!res.ok) throw new Error("Failed to create task");
      const { task } = await res.json();
      
      const newTask = {
        ...task,
        team: teams.find(t => t.id === teamId),
        submissions: []
      };

      setTasks([newTask, ...tasks]);
      setShowCreate(false);
      setTitle(""); setBrief(""); setDeadline(""); setTeamId("");
      toast.success("Task assigned successfully");
    } catch (err) {
      toast.error("Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, gap: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Task Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Assign objectives to teams and monitor operational progress.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={18} /> {showCreate ? "Cancel" : "Assign New Task"}
        </button>
      </div>

      {showCreate && (
        <div className="card animate-fade-up" style={{ padding: 24, marginBottom: 32, border: "1px solid var(--border-accent)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create Operational Task</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label className="label label-required">Task Title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Initial Access Vector Research" required />
              </div>
              <div>
                <label className="label label-required">Assign to Team</label>
                <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
                  <option value="" disabled>Select a team...</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="label">Operational Briefing</label>
              <textarea className="input" value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Provide detailed objectives and scope of engagement..." rows={4} />
            </div>

            <div style={{ maxWidth: 300 }}>
              <label className="label label-required">Deadline</label>
              <input type="datetime-local" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Assigning..." : "Deploy Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--text-muted)" }} />
          <input className="input" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            No tasks found.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = isPast(new Date(task.deadline));
            return (
              <div key={task.id} className="card card-hover" style={{ padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={20} color="var(--purple)" />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{task.title}</h3>
                    <span className="badge badge-purple">{task.team.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} color={isOverdue ? "var(--amber)" : "var(--text-muted)"} />
                    {isOverdue ? "Overdue" : "Due"} {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: task.submissions.length > 0 ? "var(--green)" : "var(--text-muted)" }}>
                      {task.submissions.length}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Submissions</div>
                  </div>
                  
                  <button className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>
                    Review <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
