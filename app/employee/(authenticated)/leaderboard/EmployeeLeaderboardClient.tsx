"use client";

import { useState, useMemo } from "react";
import { Trophy, Search, Filter, TrendingUp, Medal, Award, CheckCircle, Zap } from "lucide-react";

type Badge = { id: string; type: string; label: string; awardedAt: string };

type Employee = {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  photoUrl: string | null;
  points: number;
  monthlyPoints: number;
  team: { name: string } | null;
  badges: Badge[];
};

export default function EmployeeLeaderboardClient({
  employees,
  myEmployeeId,
  myTotalPoints,
  myMonthlyPoints,
  myBadges,
  myCompletedTasks,
  myOnTimeRate,
}: {
  employees: Employee[];
  myEmployeeId: string;
  myTotalPoints: number;
  myMonthlyPoints: number;
  myBadges: any[];
  myCompletedTasks: number;
  myOnTimeRate: number;
}) {
  const [timeframe, setTimeframe] = useState<"monthly" | "allTime">("monthly");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("All");

  const teams = useMemo(() => {
    const t = new Set(employees.map(e => e.team?.name).filter(Boolean));
    return ["All", ...Array.from(t)] as string[];
  }, [employees]);

  const overallSorted = useMemo(() => {
    return [...employees].sort((a, b) => {
      const pA = timeframe === "monthly" ? a.monthlyPoints : a.points;
      const pB = timeframe === "monthly" ? b.monthlyPoints : b.points;
      return pB - pA;
    });
  }, [employees, timeframe]);

  const employeeRanks = useMemo(() => {
    const ranks: Record<string, number> = {};
    overallSorted.forEach((e, i) => ranks[e.id] = i + 1);
    return ranks;
  }, [overallSorted]);

  const filteredEmployees = useMemo(() => {
    let filtered = overallSorted;
    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(q) || 
        (e.employeeCode && e.employeeCode.toLowerCase().includes(q))
      );
    }
    if (teamFilter !== "All") {
      filtered = filtered.filter(e => e.team?.name === teamFilter);
    }
    return filtered;
  }, [overallSorted, search, teamFilter]);

  const isFiltering = search.trim().length > 0 || teamFilter !== "All";
  const top3 = isFiltering ? [] : filteredEmployees.slice(0, 3);
  const rest = isFiltering ? filteredEmployees : filteredEmployees.slice(3);

  const getPoints = (e: Employee) => timeframe === "monthly" ? e.monthlyPoints : e.points;
  const maxPoints = overallSorted.length > 0 ? getPoints(overallSorted[0]) : 1;

  const PodiumAvatar = ({ e, place }: { e: Employee; place: 1 | 2 | 3 }) => {
    if (!e) return <div style={{ width: 100, height: 100, flexShrink: 0 }} />;
    const pts = getPoints(e);
    const size = place === 1 ? 120 : 96;
    
    // Exact step heights to ensure perfect podium staircase effect
    const stepHeight = place === 1 ? 160 : place === 2 ? 120 : 90;
    
    const colors = {
      1: { border: "#eab308", bg: "linear-gradient(180deg, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0) 100%)", solid: "#eab308", glow: "0 0 40px rgba(234,179,8,0.4)" },
      2: { border: "#cbd5e1", bg: "linear-gradient(180deg, rgba(203,213,225,0.2) 0%, rgba(203,213,225,0) 100%)", solid: "#cbd5e1", glow: "0 0 30px rgba(203,213,225,0.3)" },
      3: { border: "#d97706", bg: "linear-gradient(180deg, rgba(217,119,6,0.2) 0%, rgba(217,119,6,0) 100%)", solid: "#d97706", glow: "0 0 20px rgba(217,119,6,0.3)" }
    };
    
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: place === 1 ? 10 : 1 }}>
        <div style={{ position: "relative", animation: place === 1 ? "float 6s ease-in-out infinite" : "float 8s ease-in-out infinite", animationDelay: place === 2 ? "1s" : place === 3 ? "2s" : "0s" }}>
          <div style={{ 
            width: size, height: size, borderRadius: "50%", 
            border: `4px solid ${colors[place as keyof typeof colors].border}`, 
            padding: 4, background: "var(--bg-secondary)", 
            boxShadow: colors[place as keyof typeof colors].glow, 
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" 
          }}>
            {e.photoUrl ? (
              <img src={e.photoUrl} alt={e.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontSize: size * 0.4, fontWeight: 800, color: colors[place].border }}>
                {e.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          <div style={{ 
            position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", 
            width: 32, height: 32, borderRadius: "50%", background: colors[place].solid,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#000", fontWeight: 900, fontSize: 16, boxShadow: "0 4px 10px rgba(0,0,0,0.5)"
          }}>
            {place}
          </div>
        </div>
        
        {/* The solid podium block */}
        <div style={{ 
          marginTop: 24, width: 140, height: stepHeight,
          background: colors[place].bg, borderTop: `2px solid ${colors[place].solid}`,
          borderLeft: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", textAlign: "center", lineHeight: 1.2, marginBottom: 8 }}>{e.name.split(' ')[0]}</div>
          <div style={{ fontSize: 18, color: colors[place].solid, fontWeight: 900 }}>{pts.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>PTS</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 10px rgba(168,85,247,0.2); } 50% { box-shadow: 0 0 30px rgba(168,85,247,0.6); } 100% { box-shadow: 0 0 10px rgba(168,85,247,0.2); } }
        .row-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .row-hover:hover { background: rgba(255,255,255,0.06); transform: scale(1.02) translateX(6px); z-index: 10; position: relative; box-shadow: -4px 0 0 var(--purple), 0 15px 40px rgba(0,0,0,0.4); border-radius: 12px; }
        .hero-banner { background: radial-gradient(circle at 50% 0%, rgba(168,85,247,0.2) 0%, rgba(0,0,0,0) 70%), var(--bg-secondary); border-radius: 24px; border: 1px solid rgba(168,85,247,0.15); box-shadow: inset 0 0 60px rgba(168,85,247,0.05), 0 20px 60px rgba(0,0,0,0.3); }
        .stat-panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; transition: 0.3s; backdrop-filter: blur(12px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .stat-panel:hover { border-color: rgba(168,85,247,0.4); background: rgba(168,85,247,0.08); transform: translateY(-4px); box-shadow: 0 15px 40px rgba(168,85,247,0.15); }
        .nav-btn { padding: 12px 28px; borderRadius: 30px; fontWeight: 700; cursor: pointer; transition: 0.3s; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; }
        .nav-btn.active { background: linear-gradient(135deg, var(--purple), #6b21a8); color: #fff; animation: pulseGlow 2s infinite; border-color: rgba(168,85,247,0.5); }
        .nav-btn.inactive { background: rgba(255,255,255,0.03); color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.05); }
        .nav-btn.inactive:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); border-color: rgba(255,255,255,0.2); }
        
        .table-row { display: grid; grid-template-columns: 80px 1fr 1.5fr 1fr; gap: 16px; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.03); alignItems: center; }
        .table-header { display: grid; grid-template-columns: 80px 1fr 1.5fr 1fr; gap: 16px; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); fontSize: 11px; fontWeight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); }
        
        .podium-container { display: flex; justify-content: center; align-items: flex-end; position: relative; z-index: 2; gap: 12px; }
        
        @media (max-width: 768px) {
          .table-row { grid-template-columns: 50px 1fr 80px; gap: 12px; padding: 16px 12px; }
          .table-header { grid-template-columns: 50px 1fr 80px; gap: 12px; padding: 12px; }
          .hide-on-mobile { display: none !important; }
          .stat-panel { padding: 16px; }
          .podium-container { transform: scale(0.75); margin-bottom: -20px; }
          h1 { font-size: 32px !important; }
          .hero-banner { padding: 24px 16px 0 !important; }
        }
      `}</style>

      {/* HERO & PODIUM */}
      <div className="hero-banner" style={{ padding: "40px 40px 0", position: "relative", overflow: "hidden", marginBottom: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 48, position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.15)", color: "#d8b4fe", padding: "6px 16px", borderRadius: 30, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
            <Award size={16} /> Elite Performance
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, background: "linear-gradient(135deg, #fff 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>
            The Leaderboard
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
            <button className={`nav-btn ${timeframe === "monthly" ? "active" : "inactive"}`} onClick={() => setTimeframe("monthly")}>Monthly Rank</button>
            <button className={`nav-btn ${timeframe === "allTime" ? "active" : "inactive"}`} onClick={() => setTimeframe("allTime")}>All-Time Legends</button>
          </div>
        </div>

        {/* PODIUM */}
        <div className="podium-container">
          {top3[1] && <PodiumAvatar e={top3[1]} place={2} />}
          {top3[0] && <PodiumAvatar e={top3[0]} place={1} />}
          {top3[2] && <PodiumAvatar e={top3[2]} place={3} />}
        </div>
      </div>

      {/* MY STATS OVERVIEW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="stat-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", marginBottom: 12 }}>
            <Zap size={16} color="#a855f7" /> <span style={{ fontSize: 13, fontWeight: 600 }}>My Monthly Points</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{myMonthlyPoints.toLocaleString()}</div>
        </div>
        <div className="stat-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", marginBottom: 12 }}>
            <Trophy size={16} color="#eab308" /> <span style={{ fontSize: 13, fontWeight: 600 }}>Total Points</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{myTotalPoints.toLocaleString()}</div>
        </div>
        <div className="stat-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", marginBottom: 12 }}>
            <CheckCircle size={16} color="#3b82f6" /> <span style={{ fontSize: 13, fontWeight: 600 }}>Completed Tasks</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{myCompletedTasks}</div>
        </div>
        <div className="stat-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", marginBottom: 12 }}>
            <Medal size={16} color="#f97316" /> <span style={{ fontSize: 13, fontWeight: 600 }}>Badges Earned</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{myBadges?.length || 0}</div>
        </div>
      </div>

      {/* RANKINGS SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
          <TrendingUp size={20} color="var(--text-secondary)" /> Overall Rankings
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              placeholder="Search employees..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px 10px 40px", borderRadius: 8, color: "white", outline: "none", fontSize: 13, transition: "0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "var(--purple)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Filter size={14} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <select 
              value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px 10px 40px", borderRadius: 8, color: "white", outline: "none", appearance: "none", minWidth: 140, fontSize: 13 }}
            >
              {teams.map(t => <option key={t} value={t} style={{ background: "var(--bg-base)" }}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div className="table-header">
          <div>Rank</div>
          <div>Employee</div>
          <div className="hide-on-mobile">Progress & Team</div>
          <div style={{ textAlign: "right" }}>Score</div>
        </div>

        <div>
          {rest.map((e, idx) => {
            const rank = employeeRanks[e.id] || 0;
            const isMe = e.id === myEmployeeId;
            const pts = getPoints(e);
            const percent = maxPoints > 0 ? (pts / maxPoints) * 100 : 0;
            
            let rankColor = "var(--text-muted)";
            if (rank <= 10) rankColor = "#a855f7";
            else if (rank <= 25) rankColor = "#3b82f6";

            return (
              <div key={e.id} className="row-hover table-row" style={{ background: isMe ? "rgba(168,85,247,0.08)" : "transparent", animation: "slideUp 0.3s ease-out forwards", animationDelay: `\${idx * 0.03}s`, opacity: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: rankColor }}>
                  #{rank}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {e.photoUrl ? <img src={e.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)" }}>{e.name.substring(0, 2).toUpperCase()}</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                      {e.name}
                      {isMe && <span style={{ fontSize: 9, fontWeight: 800, background: "var(--purple)", color: "white", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 1 }}>You</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{e.designation}</div>
                  </div>
                </div>
                <div className="hide-on-mobile" style={{ display: "flex", flexDirection: "column", gap: 8, paddingRight: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
                    <span>{e.team?.name || "No Team"}</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `\${percent}%`, background: isMe ? "var(--purple)" : "linear-gradient(90deg, #a855f7, #3b82f6)", borderRadius: 4, boxShadow: isMe ? "0 0 10px rgba(168,85,247,0.5)" : "none" }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>{pts.toLocaleString()}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                    <Medal size={12} color="#eab308" /> {e.badges?.length || 0} badges
                  </div>
                </div>
              </div>
            );
          })}
          
          {rest.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)" }}>
              <Search size={32} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>No employees found matching the filters.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
