"use client";

import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { 
  FileText, AlertTriangle, Clock, CheckCircle, Search, Filter, 
  ArrowRight, ShieldAlert, Zap, Box, Star
} from "lucide-react";
import { useState, useMemo } from "react";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Low: { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: Box },
  Medium: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: Star },
  High: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: Zap },
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: ShieldAlert },
};

export default function EmployeeTasksClient({ tasks, hasTeam }: { tasks: any[]; hasTeam: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const getStatus = (task: any) => {
    if (task.submissions.length === 0) {
      const daysLeft = differenceInDays(new Date(task.deadline), new Date());
      return daysLeft < 0 ? "Overdue" : "Pending";
    }
    const status = task.submissions[0].status;
    if (status === "Approved") return "Done";
    if (status === "Need more information") return "Revision";
    return "In Review";
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, search]);

  const cols = {
    "Pending": filteredTasks.filter(t => getStatus(t) === "Pending" || getStatus(t) === "Overdue"),
    "In Review": filteredTasks.filter(t => getStatus(t) === "In Review"),
    "Revision": filteredTasks.filter(t => getStatus(t) === "Revision"),
    "Done": filteredTasks.filter(t => getStatus(t) === "Done"),
  };

  const COL_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
    "Pending": { color: "#9ca3af", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", glow: "rgba(255,255,255,0.05)" },
    "In Review": { color: "#f59e0b", bg: "rgba(245,158,11,0.03)", border: "rgba(245,158,11,0.15)", glow: "rgba(245,158,11,0.1)" },
    "Revision": { color: "#ef4444", bg: "rgba(239,68,68,0.03)", border: "rgba(239,68,68,0.15)", glow: "rgba(239,68,68,0.1)" },
    "Done": { color: "#34d399", bg: "rgba(52,211,153,0.03)", border: "rgba(52,211,153,0.15)", glow: "rgba(52,211,153,0.1)" },
  };

  return (
    <div style={{ paddingBottom: 60, animation: "fadeIn 0.5s ease" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .kanban-col { flex: 1; min-width: 280px; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 14px; transition: all 0.3s; }
        .kanban-card { background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; }
        .kanban-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 32px rgba(0,0,0,0.4); border-color: rgba(168,85,247,0.4); }
        .kanban-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; transition: 0.3s; }
        .kanban-card:hover::before { box-shadow: 0 0 15px currentColor; }
        .kanban-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; flex-wrap: wrap; gap: 16px; }
        .search-bar { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 16px 10px 40px; color: #fff; width: 100%; max-width: 300px; outline: none; transition: 0.2s; }
        .search-bar:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168,85,247,0.2); }
      `}</style>

      {/* HEADER */}
      <div className="kanban-header">
        <div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px 0", background: "linear-gradient(to right, #fff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            My Workspace Tasks
          </h1>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: 14 }}>
            Manage your assignments, submit work, and track review progress.
          </p>
        </div>
        <div style={{ position: "relative", flexShrink: 0, width: "100%", maxWidth: 300 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!hasTeam && tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 24, marginTop: 40 }}>
          <div style={{ width: 80, height: 80, background: "rgba(245,158,11,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <AlertTriangle size={36} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "#fff" }}>No Team Assigned</h2>
          <p style={{ color: "#9ca3af", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            You haven't been assigned to any team yet. Once your manager adds you to a team, your tasks will appear here.
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 24, marginTop: 40 }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 30px rgba(168,85,247,0.2)" }}>
            <CheckCircle size={36} color="#a855f7" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "#fff" }}>All Caught Up!</h2>
          <p style={{ color: "#9ca3af", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            You have zero assigned tasks right now. Enjoy the downtime or check out the company announcements.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 20, minHeight: 600 }}>
          {(Object.keys(cols) as Array<keyof typeof cols>).map((colName) => {
            const columnTasks = cols[colName];
            const cfg = COL_CONFIG[colName];
            return (
              <div key={colName} className="kanban-col" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `inset 0 10px 40px ${cfg.glow}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: "0 4px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }} />
                    {colName}
                  </h3>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {columnTasks.length}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {columnTasks.length === 0 ? (
                    <div style={{ padding: "30px 20px", textAlign: "center", color: "#6b7280", fontSize: 13, background: "rgba(0,0,0,0.1)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.05)" }}>
                      Empty
                    </div>
                  ) : (
                    columnTasks.map(task => {
                      const status = getStatus(task);
                      const isOverdue = status === "Overdue";
                      const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                      const Icon = pCfg.icon;

                      return (
                        <div 
                          key={task.id} 
                          className="kanban-card" 
                          onClick={() => router.push(`/employee/tasks/${task.id}`)}
                          style={{ borderLeftColor: pCfg.color, color: pCfg.color }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12, color: "#fff" }}>
                            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{task.title}</div>
                            {isOverdue && (
                              <div style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                <AlertTriangle size={10} /> OVERDUE
                              </div>
                            )}
                          </div>
                          
                          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                            {task.brief || "No description provided."}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: pCfg.color, background: pCfg.bg, padding: "4px 8px", borderRadius: 6 }}>
                              <Icon size={12} /> {task.priority}
                            </div>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isOverdue ? "#ef4444" : "#6b7280", fontWeight: 500 }}>
                              <Clock size={12} />
                              {format(new Date(task.deadline), "MMM d")}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
