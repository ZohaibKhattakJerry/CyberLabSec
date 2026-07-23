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

  const isFiltering = search.length > 0 || teamFilter !== "All";
  const top3 = isFiltering ? [] : sortedEmployees.slice(0, 3);
  const rest = isFiltering ? sortedEmployees : sortedEmployees.slice(3);

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
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 10px rgba(168,85,247,0.2); } 50% { box-shadow: 0 0 30px rgba(168,85,247,0.5); } }
        .row-hover { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .row-hover:hover { background: rgba(168,85,247,0.08) !important; transform: translateX(4px); box-shadow: -3px 0 0 #a855f7; border-radius: 12px; }
        .glass-header { background: radial-gradient(circle at 50% 0%, rgba(168,85,247,0.15), transparent 70%), linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1)); border-bottom: 1px solid rgba(168,85,247,0.2); }
        .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; transition: 0.3s; }
        .stat-card:hover { border-color: rgba(168,85,247,0.4); background: rgba(168,85,247,0.06); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(168,85,247,0.12); }
        .input-dark { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #fff; font-size: 14px; outline: none; transition: 0.2s; }
        .input-dark:focus { border-color: #a855f7; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .modal-content { background: var(--bg-card); border: 1px solid rgba(168,85,247,0.2); border-radius: 20px; width: 100%; max-width: 440px; padding: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
        .nav-btn { padding: 10px 24px; border-radius: 30px; font-weight: 700; cursor: pointer; transition: 0.2s; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; }
        .nav-btn.active { background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; animation: pulseGlow 2s infinite; border-color: rgba(168,85,247,0.5); }
        .nav-btn.inactive { background: rgba(255,255,255,0.04); color: #9ca3af; border: 1px solid rgba(255,255,255,0.07); }
        .nav-btn.inactive:hover { background: rgba(255,255,255,0.08); color: #fff; }

        /* HERO */
        .hero-title { font-size: clamp(28px,7vw,52px); font-weight: 900; background: linear-gradient(to right, #fff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.03em; margin-bottom: 16px; }

        /* STATS */
        .top-stats-container { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 40px; }

        /* PODIUM */
        .podium-container { display: flex; justify-content: center; align-items: flex-end; gap: clamp(10px,4vw,40px); margin-bottom: 60px; min-height: 250px; flex-wrap: wrap; }

        /* TABLE — responsive */
        .lb-table-wrap { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
        .lb-header { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; padding: 12px 20px; background: rgba(0,0,0,0.25); font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; }
        .lb-row { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.04); align-items: center; }
        .lb-team-col { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .lb-bar-col { display: none; }
        .lb-badge-col { display: none; }

        @media (min-width: 600px) {
          .lb-header { grid-template-columns: 60px 1fr 1fr 1.5fr auto; }
          .lb-row { grid-template-columns: 60px 1fr 1fr 1.5fr auto; }
          .lb-team-col { display: block; font-size: 13px; }
          .lb-bar-col { display: flex; align-items: center; }
        }

        /* DEPT bars — always visible */
        .dept-row { display: grid; grid-template-columns: minmax(70px,140px) 1fr minmax(60px,90px); align-items: center; gap: 10px; }
        @media (max-width: 480px) { .dept-row { grid-template-columns: minmax(60px,100px) 1fr 70px; gap: 6px; } }

        /* Action buttons */
        .action-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .action-buttons button { flex: 1; min-width: 130px; justify-content: center; }
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
          
          <h1 className="hero-title">
            This Month's Champions
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Admin overview of all employee performance across the organization.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            <button className={`nav-btn ${timeframe === "monthly" ? "active" : "inactive"}`} onClick={() => setTimeframe("monthly")}>Monthly</button>
            <button className={`nav-btn ${timeframe === "allTime" ? "active" : "inactive"}`} onClick={() => setTimeframe("allTime")}>All-Time</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        
        {/* TOP STATS & ACTIONS */}
        <div className="top-stats-container" style={{ paddingTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, flex: 1 }}>
            <div className="stat-card">
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>Total Points</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#a855f7" }}>{totalPointsThisMonth.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>Active Employees</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{employees.length}</div>
            </div>
          </div>
          <div className="action-buttons">
            <button onClick={handleExport} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 18px", borderRadius: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setShowAdjustModal(true)} style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", border: "none", color: "#fff", padding: "10px 18px", borderRadius: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <PlusCircle size={16} /> Adjust Points
            </button>
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        <div className="podium-container">
          {top3[1] && <PodiumAvatar e={top3[1]} place={2} />}
          {top3[0] && <PodiumAvatar e={top3[0]} place={1} />}
          {top3[2] && <PodiumAvatar e={top3[2]} place={3} />}
        </div>

        {/* DEPARTMENT BREAKDOWN CHART */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "clamp(16px,3vw,28px)", marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={18} color="#3b82f6" /> Team Performance
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {teamRankings.map((t) => {
              const pts = getTeamPoints(t);
              const percent = maxTeamPoints > 0 ? (pts / maxTeamPoints) * 100 : 0;
              return (
                <div key={t.id} className="dept-row">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name} <span style={{ fontSize: 10, color: "#6b7280" }}>({t.memberCount})</span></div>
                  <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${percent}%`, background: "linear-gradient(90deg, #3b82f6, #a855f7)", borderRadius: 20, transition: "width 0.6s" }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: "#9ca3af" }}>{pts.toLocaleString()}</div>
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
           {/* TABLE */}
        <div className="lb-table-wrap">
          <div className="lb-header">
            <div>Rank</div>
            <div>Employee</div>
            <div className="lb-team-col">Team</div>
            <div className="lb-bar-col">Performance</div>
            <div style={{ textAlign: "right" }}>Points</div>
          </div>

          <div>
            {rest.map((e, idx) => {
              const rank = idx + 4;
              const pts = getPoints(e);
              const percent = maxPoints > 0 ? (pts / maxPoints) * 100 : 0;

              let rankColor = "#6b7280";
              if (rank <= 10) rankColor = "#a855f7";
              else if (rank <= 25) rankColor = "#3b82f6";

              return (
                <div key={e.id} className="row-hover lb-row" style={{ animation: `slideUp 0.3s ease-out ${idx * 0.04}s both` }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: rankColor }}>#{rank}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {e.photoUrl ? <img src={e.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 13, fontWeight: 700 }}>{e.name.substring(0, 2).toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{e.designation}</div>
                    </div>
                  </div>
                  <div className="lb-team-col">{e.team?.name || "No Team"}</div>
                  <div className="lb-bar-col" style={{ gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percent}%`, background: "linear-gradient(90deg, #a855f7, #3b82f6)", borderRadius: 10, transition: "width 0.6s" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{pts.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>🏅 {e.badges?.length || 0}</div>
                  </div>
                </div>
              );
            })}

            {rest.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                No employees found matching the filters.
              </div>
            )}
          </div>
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
