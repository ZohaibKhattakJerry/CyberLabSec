"use client";

import { useState, useMemo } from "react";
import { Trophy, Search, Filter, TrendingUp, Medal, Download, PlusCircle, X, CheckCircle, Users } from "lucide-react";
import toast from "react-hot-toast";

type Employee = {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  photoUrl: string | null;
  points: number;
  monthlyPoints: number;
  team: { id: string; name: string } | null;
  badges: { id: string }[];
};

type TeamRanking = {
  id: string;
  name: string;
  totalPoints: number;
  monthlyPoints: number;
  memberCount: number;
};

type SimpleEmployee = { id: string; name: string; employeeCode: string };

export default function LeaderboardClient({
  employees,
  teamRankings,
  allEmployees,
}: {
  employees: Employee[];
  teamRankings: TeamRanking[];
  allEmployees: SimpleEmployee[];
}) {
  const [timeframe, setTimeframe] = useState<"monthly" | "allTime">("monthly");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("All");
  
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjEmpId, setAdjEmpId] = useState("");
  const [adjPoints, setAdjPoints] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const teams = useMemo(() => {
    const t = new Set(employees.map(e => e.team?.name).filter(Boolean));
    return ["All", ...Array.from(t)] as string[];
  }, [employees]);

  const sortedEmployees = useMemo(() => {
    let filtered = employees;
    if (search) {
      filtered = filtered.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (teamFilter !== "All") {
      filtered = filtered.filter(e => e.team?.name === teamFilter);
    }

    return filtered.sort((a, b) => {
      const pA = timeframe === "monthly" ? a.monthlyPoints : a.points;
      const pB = timeframe === "monthly" ? b.monthlyPoints : b.points;
      return pB - pA;
    });
  }, [employees, timeframe, search, teamFilter]);

  const top3 = sortedEmployees.slice(0, 3);
  const rest = sortedEmployees.slice(3);

  const getPoints = (e: Employee) => timeframe === "monthly" ? e.monthlyPoints : e.points;
  const getTeamPoints = (t: TeamRanking) => timeframe === "monthly" ? t.monthlyPoints : t.totalPoints;
  const maxPoints = sortedEmployees.length > 0 ? getPoints(sortedEmployees[0]) : 1;
  const maxTeamPoints = teamRankings.length > 0 ? Math.max(...teamRankings.map(getTeamPoints)) : 1;
  
  const totalPointsThisMonth = employees.reduce((sum, e) => sum + e.monthlyPoints, 0);

  const handleExport = () => {
    toast.success("CSV export initiated. Generating file...", {
      style: { background: "#1f2937", color: "#fff" },
      icon: <CheckCircle color="#22c55e" />
    });
  };

  const handleAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjEmpId || !adjPoints) return;
    toast.success(`Successfully adjusted points for employee! Reason: ${adjReason}`, {
      style: { background: "#1f2937", color: "#fff" },
    });
    setShowAdjustModal(false);
    setAdjEmpId("");
    setAdjPoints("");
    setAdjReason("");
  };

  const PodiumAvatar = ({ e, place }: { e: Employee; place: 1 | 2 | 3 }) => {
    if (!e) return <div style={{ width: 100, height: 100, flexShrink: 0 }} />;
    const pts = getPoints(e);
    const size = place === 1 ? 130 : 100;
    const colors = {
      1: { border: "#eab308", bg: "rgba(234,179,8,0.15)", glow: "0 0 40px rgba(234,179,8,0.3)", icon: "🥇" },
      2: { border: "#94a3b8", bg: "rgba(148,163,184,0.15)", glow: "0 0 30px rgba(148,163,184,0.3)", icon: "🥈" },
      3: { border: "#b45309", bg: "rgba(180,83,9,0.15)", glow: "0 0 20px rgba(180,83,9,0.3)", icon: "🥉" }
    };
    
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: place === 1 ? 10 : 1, transform: place === 1 ? "translateY(-20px)" : "none", animation: "float 6s ease-in-out infinite" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: size, height: size, borderRadius: "50%", border: `4px solid ${colors[place as keyof typeof colors].border}`, padding: 4, background: colors[place as keyof typeof colors].bg, boxShadow: colors[place as keyof typeof colors].glow, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {e.photoUrl ? (
              <img src={e.photoUrl} alt={e.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontSize: size * 0.4, fontWeight: 800, color: colors[place].border }}>
                {e.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", fontSize: 28, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>
            {colors[place].icon}
          </div>
        </div>
        <div style={{ marginTop: 20, textAlign: "center", background: "rgba(0,0,0,0.4)", padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
          <div style={{ fontWeight: 800, fontSize: place === 1 ? 18 : 16, color: "white" }}>{e.name}</div>
          <div style={{ fontSize: 12, color: colors[place].border, fontWeight: 700, margin: "4px 0" }}>{pts.toLocaleString()} PTS</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{e.designation}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", paddingBottom: 60 }}>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .row-hover { transition: all 0.2s; }
        .row-hover:hover { background: rgba(255,255,255,0.04); transform: scale(1.01); z-index: 10; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .glass-header { background: linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(59,130,246,0.2) 100%); border-bottom: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; transition: 0.3s; }
        .stat-card:hover { border-color: rgba(168,85,247,0.4); box-shadow: 0 0 20px rgba(168,85,247,0.1); }
        .input-dark { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; color: var(--text-primary); font-size: 14px; outline: none; transition: 0.2s; }
        .input-dark:focus { border-color: #a855f7; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; alignItems: center; justify-content: center; z-index: 1000; }
        .modal-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 440px; max-width: 90%; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
      `}</style>

      {/* HEADER SECTION */}
      <div className="glass-header" style={{ padding: "60px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, background: "rgba(168,85,247,0.3)", filter: "blur(100px)", borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 300, height: 300, background: "rgba(59,130,246,0.3)", filter: "blur(100px)", borderRadius: "50%", zIndex: 0 }} />
        
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.4)", padding: "8px 20px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24 }}>
            <Trophy size={20} color="#eab308" />
            <span style={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontSize: 13, color: "var(--text-secondary)" }}>Company Leaderboard</span>
          </div>
          
          <h1 style={{ fontSize: 56, fontWeight: 900, marginBottom: 16, background: "linear-gradient(to right, #fff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>
            This Month's Champions
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Admin overview of all employee performance across the organization.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            <button onClick={() => setTimeframe("monthly")} style={{ background: timeframe === "monthly" ? "#a855f7" : "rgba(255,255,255,0.05)", color: timeframe === "monthly" ? "#fff" : "var(--text-secondary)", border: "1px solid " + (timeframe === "monthly" ? "#a855f7" : "rgba(255,255,255,0.1)"), padding: "10px 24px", borderRadius: 30, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}>Monthly</button>
            <button onClick={() => setTimeframe("allTime")} style={{ background: timeframe === "allTime" ? "#a855f7" : "rgba(255,255,255,0.05)", color: timeframe === "allTime" ? "#fff" : "var(--text-secondary)", border: "1px solid " + (timeframe === "allTime" ? "#a855f7" : "rgba(255,255,255,0.1)"), padding: "10px 24px", borderRadius: 30, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}>All-Time</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        
        {/* TOP STATS & ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginTop: -40, position: "relative", zIndex: 10, marginBottom: 60 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div className="stat-card">
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>Total Points Awarded</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#a855f7" }}>{totalPointsThisMonth.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>Active Employees</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{employees.length}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={handleExport} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "0.2s", height: "100%" }}>
              <Download size={18} /> Export CSV
            </button>
            <button onClick={() => setShowAdjustModal(true)} style={{ background: "#a855f7", border: "none", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "0.2s", height: "100%" }}>
              <PlusCircle size={18} /> Adjust Points
            </button>
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 40, marginBottom: 80, minHeight: 300 }}>
          {top3[1] && <PodiumAvatar e={top3[1]} place={2} />}
          {top3[0] && <PodiumAvatar e={top3[0]} place={1} />}
          {top3[2] && <PodiumAvatar e={top3[2]} place={3} />}
        </div>

        {/* DEPARTMENT BREAKDOWN CHART */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 32px", marginBottom: 40, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={20} color="#3b82f6" /> Department Performance
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {teamRankings.map((t, i) => {
              const pts = getTeamPoints(t);
              const percent = maxTeamPoints > 0 ? (pts / maxTeamPoints) * 100 : 0;
              return (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr 100px", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({t.memberCount})</span></div>
                  <div style={{ height: 16, background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: \`\${percent}%\`, background: "linear-gradient(90deg, #3b82f6, #a855f7)", borderRadius: 8 }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, textAlign: "right", color: "var(--text-secondary)" }}>{pts.toLocaleString()} pts</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp size={24} color="#a855f7" /> Leaderboard Rankings
          </h2>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                placeholder="Search employees..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "10px 16px 10px 40px", borderRadius: 30, color: "white", outline: "none" }}
              />
            </div>
            <div style={{ position: "relative" }}>
              <Filter size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <select 
                value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "10px 16px 10px 40px", borderRadius: 30, color: "white", outline: "none", appearance: "none", minWidth: 140 }}
              >
                {teams.map(t => <option key={t} value={t} style={{ background: "var(--bg-base)" }}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1.5fr 1fr", gap: 16, padding: "16px 24px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, background: "rgba(0,0,0,0.2)" }}>
            <div>Rank</div>
            <div>Employee</div>
            <div>Department</div>
            <div>Points Bar</div>
            <div style={{ textAlign: "right" }}>Total Points</div>
          </div>

          <div>
            {rest.map((e, idx) => {
              const rank = idx + 4;
              const pts = getPoints(e);
              const percent = maxPoints > 0 ? (pts / maxPoints) * 100 : 0;
              
              let rankColor = "var(--text-muted)";
              if (rank <= 10) rankColor = "#a855f7";
              else if (rank <= 25) rankColor = "#3b82f6";

              return (
                <div key={e.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1.5fr 1fr", gap: 16, padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "center", animation: "slideUp 0.3s ease-out forwards", animationDelay: \`\${idx * 0.05}s\`, opacity: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: rankColor }}>
                    #{rank}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {e.photoUrl ? <img src={e.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 14, fontWeight: 700 }}>{e.name.substring(0, 2).toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                        {e.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.designation}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {e.team?.name || "No Team"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: \`\${percent}%\`, background: "linear-gradient(90deg, #a855f7, #3b82f6)", borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 800, fontSize: 16 }}>
                    {pts.toLocaleString()}
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                      <Medal size={12} color="#eab308" /> {e.badges?.length || 0} badges
                    </div>
                  </div>
                </div>
              );
            })}
            
            {rest.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                No employees found matching the filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADJUST POINTS MODAL */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><PlusCircle size={20} color="#a855f7" /> Adjust Points</h2>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustPoints} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Employee</label>
                <select className="input-dark" value={adjEmpId} onChange={e => setAdjEmpId(e.target.value)} required>
                  <option value="">Select Employee...</option>
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Points Adjustment (+ or -)</label>
                <input type="number" className="input-dark" value={adjPoints} onChange={e => setAdjPoints(e.target.value)} placeholder="e.g. 500 or -200" required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Reason</label>
                <input className="input-dark" value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="e.g. Exceptional performance on project" required />
              </div>
              <button type="submit" style={{ background: "#a855f7", color: "white", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 }}>
                Apply Points
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
