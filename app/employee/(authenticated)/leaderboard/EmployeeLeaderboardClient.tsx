"use client";

import { useState, useMemo } from "react";
import { Trophy, Search, Filter, Star, TrendingUp, Medal } from "lucide-react";

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
  const maxPoints = sortedEmployees.length > 0 ? getPoints(sortedEmployees[0]) : 1;

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
          <div style={{ width: size, height: size, borderRadius: "50%", border: \`4px solid \${colors[place].border}\`, padding: 4, background: colors[place].bg, boxShadow: colors[place].glow, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
      `}</style>

      {/* HEADER SECTION */}
      <div className="glass-header" style={{ padding: "60px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, background: "rgba(168,85,247,0.3)", filter: "blur(100px)", borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 300, height: 300, background: "rgba(59,130,246,0.3)", filter: "blur(100px)", borderRadius: "50%", zIndex: 0 }} />
        
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.4)", padding: "8px 20px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24 }}>
            <Trophy size={20} color="#eab308" />
            <span style={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontSize: 13, color: "var(--text-secondary)" }}>Performance Leaderboard</span>
          </div>
          
          <h1 style={{ fontSize: 56, fontWeight: 900, marginBottom: 16, background: "linear-gradient(to right, #fff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>
            This Month's Champions
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Top performers pushing the boundaries of excellence at CyberLabSec.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            <button onClick={() => setTimeframe("monthly")} style={{ background: timeframe === "monthly" ? "#a855f7" : "rgba(255,255,255,0.05)", color: timeframe === "monthly" ? "#fff" : "var(--text-secondary)", border: "1px solid " + (timeframe === "monthly" ? "#a855f7" : "rgba(255,255,255,0.1)"), padding: "10px 24px", borderRadius: 30, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}>Monthly</button>
            <button onClick={() => setTimeframe("allTime")} style={{ background: timeframe === "allTime" ? "#a855f7" : "rgba(255,255,255,0.05)", color: timeframe === "allTime" ? "#fff" : "var(--text-secondary)", border: "1px solid " + (timeframe === "allTime" ? "#a855f7" : "rgba(255,255,255,0.1)"), padding: "10px 24px", borderRadius: 30, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}>All-Time</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        
        {/* MY STATS OVERVIEW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: -40, position: "relative", zIndex: 10, marginBottom: 60 }}>
          <div className="stat-card">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>My Monthly Points</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#a855f7" }}>{myMonthlyPoints.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>My Total Points</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{myTotalPoints.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>Completed Tasks</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#3b82f6" }}>{myCompletedTasks}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>Badges Earned</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#eab308" }}>{myBadges?.length || 0}</div>
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 40, marginBottom: 80, minHeight: 300 }}>
          {top3[1] && <PodiumAvatar e={top3[1]} place={2} />}
          {top3[0] && <PodiumAvatar e={top3[0]} place={1} />}
          {top3[2] && <PodiumAvatar e={top3[2]} place={3} />}
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
              const isMe = e.id === myEmployeeId;
              const pts = getPoints(e);
              const percent = maxPoints > 0 ? (pts / maxPoints) * 100 : 0;
              
              let rankColor = "var(--text-muted)";
              if (rank <= 10) rankColor = "#a855f7";
              else if (rank <= 25) rankColor = "#3b82f6";

              return (
                <div key={e.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1.5fr 1fr", gap: 16, padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "center", background: isMe ? "rgba(168,85,247,0.1)" : "transparent", animation: "slideUp 0.3s ease-out forwards", animationDelay: \`\${idx * 0.05}s\`, opacity: 0 }}>
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
                        {isMe && <span style={{ fontSize: 10, background: "#a855f7", color: "white", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>You</span>}
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
    </div>
  );
}
