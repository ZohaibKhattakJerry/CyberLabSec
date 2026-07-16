"use client";

import { useState } from "react";
import { Trophy, _Medal, _Star, Users, TrendingUp, _Plus, _Minus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  photoUrl: string | null;
  points: number;
  monthlyPoints: number;
  team: { id: string; name: string } | null;
  badges: { id: string; type: string; label: string; awardedAt: string }[];
  submissions: { id: string; qualityRating: number | null; submittedAt: string; task: { title: string } | null }[];
};

type TeamRanking = {
  id: string;
  name: string;
  totalPoints: number;
  monthlyPoints: number;
  memberCount: number;
};

type SimpleEmployee = { id: string; name: string; employeeCode: string };

const BADGE_ICONS: Record<string, string> = {
  FirstTask: "🎯",
  TenTasks: "🔟",
  PerfectMonth: "⭐",
  TopPerformer: "🏆",
};

export default function LeaderboardClient({
  employees,
  teamRankings,
  allEmployees,
}: {
  employees: Employee[];
  teamRankings: TeamRanking[];
  allEmployees: SimpleEmployee[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"monthly" | "alltime">("monthly");
  const [activeTab, setActiveTab] = useState<"individual" | "team">("individual");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ employeeId: "", points: 0, reason: "" });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const sorted = [...employees].sort((a, b) =>
    view === "monthly" ? b.monthlyPoints - a.monthlyPoints : b.points - a.points
  );

  const sortedTeams = [...teamRankings].sort((a, b) =>
    view === "monthly" ? b.monthlyPoints - a.monthlyPoints : b.totalPoints - a.totalPoints
  );

  const top3 = sorted.slice(0, 3);
//   const rest = sorted.slice(3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  const getPoints = (e: Employee) => view === "monthly" ? e.monthlyPoints : e.points;
  const getTeamPoints = (t: TeamRanking) => view === "monthly" ? t.monthlyPoints : t.totalPoints;

  const podiumConfig = [
    { medal: "🥈", height: 80, color: "#94a3b8", label: "2nd", glow: "rgba(148,163,184,0.3)" },
    { medal: "🥇", height: 110, color: "#f59e0b", label: "1st", glow: "rgba(245,158,11,0.4)" },
    { medal: "🥉", height: 60, color: "#cd7f32", label: "3rd", glow: "rgba(205,127,50,0.3)" },
  ];

  const handleAdjust = async () => {
    if (!adjustForm.employeeId || !adjustForm.reason.trim() || adjustForm.points === 0) {
      toast.error("Please fill all fields");
      return;
    }
    setAdjustLoading(true);
    try {
      const res = await fetch("/api/company/leaderboard/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustForm),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Points adjusted successfully");
      setShowAdjust(false);
      setAdjustForm({ employeeId: "", points: 0, reason: "" });
      router.refresh();
    } catch {
      toast.error("Failed to adjust points");
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 12 }}>
            <Trophy size={28} color="var(--amber)" /> Leaderboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Employee performance rankings based on task approvals and quality.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdjust(true)}>
            <TrendingUp size={14} /> Adjust Points
          </button>
        </div>
      </div>

      {/* View toggles */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div className="tab-group">
          <button className={`tab-item ${view === "monthly" ? "active" : ""}`} onClick={() => setView("monthly")}>This Month</button>
          <button className={`tab-item ${view === "alltime" ? "active" : ""}`} onClick={() => setView("alltime")}>All Time</button>
        </div>
        <div className="tab-group">
          <button className={`tab-item ${activeTab === "individual" ? "active" : ""}`} onClick={() => setActiveTab("individual")}>Individual</button>
          <button className={`tab-item ${activeTab === "team" ? "active" : ""}`} onClick={() => setActiveTab("team")}>Teams</button>
        </div>
      </div>

      {activeTab === "individual" && (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 2 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 0 }}>
                {podiumOrder.map((emp, i) => {
                  const pc = podiumConfig[i];
                  if (!emp) return null;
                  return (
                    <div key={emp.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{pc.medal}</div>
                      <div style={{ width: 60, height: 60, borderRadius: "50%", background: `rgba(${pc.glow})`, border: `2px solid ${pc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, marginBottom: 8, boxShadow: `0 0 20px ${pc.glow}` }}>
                        {emp.name[0]}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textAlign: "center", marginBottom: 2 }}>{emp.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 12, color: pc.color, fontWeight: 700 }}>{getPoints(emp)} pts</div>
                      <div style={{ background: pc.color, width: "100%", height: pc.height, borderRadius: "8px 8px 0 0", marginTop: 12, opacity: 0.15 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full rankings */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 13, color: "var(--text-muted)", display: "grid", gridTemplateColumns: "48px 1fr auto auto", gap: 12 }}>
              <span>#</span><span>Employee</span><span style={{ textAlign: "right" }}>Badges</span><span style={{ textAlign: "right", minWidth: 80 }}>Points</span>
            </div>
            {sorted.map((emp, i) => (
              <div key={emp.id}>
                <div
                  onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                  style={{ padding: "14px 20px", borderBottom: expandedEmployee === emp.id ? "none" : "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "48px 1fr auto auto", gap: 12, alignItems: "center", background: i < 3 ? "rgba(245,158,11,0.02)" : "transparent", cursor: "pointer" }}
                  className="card-hover"
                >
                  <div style={{ fontWeight: 800, fontSize: 18, color: i === 0 ? "var(--amber)" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--text-muted)" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{emp.designation}{emp.team ? ` · ${emp.team.name}` : ""} · {emp.submissions.length} tasks approved</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {emp.badges.slice(0, 3).map(b => (
                      <span key={b.type} title={b.label} style={{ fontSize: 16 }}>{BADGE_ICONS[b.type] || "🏅"}</span>
                    ))}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: i < 3 ? "var(--amber)" : "var(--text-primary)" }}>{getPoints(emp)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>points {expandedEmployee === emp.id ? "▲" : "▼"}</div>
                  </div>
                </div>
                {/* Drill-down breakdown */}
                {expandedEmployee === emp.id && (
                  <div style={{ padding: "0 20px 16px", borderBottom: "1px solid var(--border-subtle)", background: "rgba(168,85,247,0.03)" }}>
                    {emp.submissions.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>No approved submissions yet.</p>
                    ) : (
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "8px 0 4px" }}>Approved Tasks</div>
                        {emp.submissions.map((sub) => (
                          <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "5px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                            <span style={{ color: "var(--text-secondary)", flex: 1 }}>{sub.task?.title || "—"}</span>
                            <span style={{ color: "var(--amber)", marginRight: 10 }}>{'★'.repeat(sub.qualityRating || 0)}{'☆'.repeat(5 - (sub.qualityRating || 0))}</span>
                            <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(sub.submittedAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {sorted.length === 0 && (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No active employees yet.</div>
            )}
          </div>
        </>
      )}

      {activeTab === "team" && (
        <div style={{ display: "grid", gap: 12 }}>
          {sortedTeams.map((team, i) => (
            <div key={team.id} className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 24, width: 40, textAlign: "center" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={16} color="var(--purple)" /> {team.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: "var(--amber)" }}>{getTeamPoints(team)}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>points</div>
              </div>
            </div>
          ))}
          {sortedTeams.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No teams created yet.</div>
          )}
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjust && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Manual Point Adjustment</h2>
              <button onClick={() => setShowAdjust(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label label-required">Employee</label>
                <select className="input" value={adjustForm.employeeId} onChange={e => setAdjustForm({ ...adjustForm, employeeId: e.target.value })}>
                  <option value="">Select employee...</option>
                  {allEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
                </select>
              </div>
              <div>
                <label className="label label-required">Points (positive = add, negative = deduct)</label>
                <input
                  type="number"
                  className="input"
                  value={adjustForm.points || ""}
                  onChange={e => setAdjustForm({ ...adjustForm, points: Number(e.target.value) })}
                  placeholder="e.g. 50 or -10"
                />
              </div>
              <div>
                <label className="label label-required">Reason (required, logged)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Recognition for exceptional client report..."
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdjust(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdjust} disabled={adjustLoading}>
                  {adjustLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Apply Adjustment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
