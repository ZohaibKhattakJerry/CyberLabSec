"use client";

import React, { useState } from "react";
import { Trophy, Medal, Award, Search, Zap } from "lucide-react";


type LeaderboardEmployee = {
  id: string; name: string; designation: string; teamName: string;
  score: number; submissionsCount: number; tier: string;
};

export default function LeaderboardClient({ employees }: { employees: LeaderboardEmployee[] }) {
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("All");

  const teams = Array.from(new Set(employees.map(e => e.teamName)));

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q);
    const matchTeam = filterTeam === "All" || e.teamName === filterTeam;
    return matchSearch && matchTeam;
  });

  const top3 = filtered.slice(0, 3);
//   const rest = filtered.slice(3);

  // Reorder top3 for visual podium: [2, 1, 3]
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input className="input" style={{ paddingLeft: 44, borderRadius: 24, height: 44 }} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 220, borderRadius: 24, height: 44 }} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="All">All Squads</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {podium.length > 0 && filterTeam === "All" && !search && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 48, height: 280, marginTop: 20 }}>
          {podium.map((e, i) => {
            const isFirst = e.id === top3[0]?.id;
            const isSecond = e.id === top3[1]?.id;
            const isThird = e.id === top3[2]?.id;
            
            let height = 140;
            let bg = "rgba(255,255,255,0.05)";
            let border = "1px solid rgba(255,255,255,0.1)";
            let icon: React.ReactNode = null;
            let rankNum = 0;

            if (isFirst) { height = 200; bg = "linear-gradient(to top, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05))"; border = "1px solid rgba(251, 191, 36, 0.5)"; icon = <Trophy size={32} color="#fbbf24" style={{ marginBottom: 12 }} />; rankNum = 1; }
            else if (isSecond) { height = 160; bg = "linear-gradient(to top, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.05))"; border = "1px solid rgba(148, 163, 184, 0.5)"; icon = <Medal size={28} color="#94a3b8" style={{ marginBottom: 12 }} />; rankNum = 2; }
            else if (isThird) { height = 140; bg = "linear-gradient(to top, rgba(180, 83, 9, 0.2), rgba(180, 83, 9, 0.05))"; border = "1px solid rgba(180, 83, 9, 0.5)"; icon = <Award size={28} color="#b45309" style={{ marginBottom: 12 }} />; rankNum = 3; }

            return (
              <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140, position: "relative", animation: "fade-up 0.5s ease-out backwards", animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, border, zIndex: 2, marginBottom: -32 }}>
                  {e.name.charAt(0)}
                </div>
                <div style={{ width: "100%", height, background: bg, border, borderBottom: "none", borderTopLeftRadius: 16, borderTopRightRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, position: "relative" }}>
                  {icon}
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", padding: "0 8px", lineHeight: 1.2 }}>{e.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{e.score.toLocaleString()} PTS</div>
                  <div style={{ position: "absolute", bottom: -20, fontSize: 80, fontWeight: 900, color: "rgba(255,255,255,0.03)", lineHeight: 1 }}>{rankNum}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card table-wrapper" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "rgba(0,0,0,0.2)" }}>
            <tr>
              <th style={{ width: 80, textAlign: "center", padding: "16px 12px", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Rank</th>
              <th style={{ padding: "16px 12px", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "left" }}>Employee</th>
              <th style={{ padding: "16px 12px", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "left" }}>Designation</th>
              <th style={{ padding: "16px 12px", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "left" }}>Squad</th>
              <th style={{ textAlign: "right", padding: "16px 12px", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Objectives</th>
              <th style={{ textAlign: "right", padding: "16px 24px", color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, index) => {
              const rank = index + 1;
              let RankIcon: React.ReactNode = null;
              if (rank === 1) RankIcon = <Trophy size={18} color="#fbbf24" />;
              else if (rank === 2) RankIcon = <Medal size={18} color="#94a3b8" />;
              else if (rank === 3) RankIcon = <Award size={18} color="#b45309" />;

              return (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: "transparent", transition: "all 0.2s" }} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td data-label="Rank" style={{ textAlign: "center", padding: "16px 12px", fontWeight: 800, fontSize: 16, color: rank <= 3 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {RankIcon ? <div style={{ display: "flex", justifyContent: "center" }}>{RankIcon}</div> : <span style={{ opacity: 0.5 }}>#{rank}</span>}
                  </td>
                  <td data-label="Employee" style={{ padding: "16px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{e.name}</div>
                        {(e.tier === "Executive" || e.tier === "Lead") && (
                          <div style={{ fontSize: 11, color: e.tier === "Executive" ? "var(--amber)" : "var(--blue)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Zap size={10} /> {e.tier}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Role" style={{ padding: "16px 12px", fontSize: 13, color: "var(--text-secondary)" }}>{e.designation}</td>
                  <td data-label="Squad" style={{ padding: "16px 12px" }}><span className="badge badge-gray">{e.teamName}</span></td>
                  <td data-label="Approved Tasks" style={{ padding: "16px 12px", textAlign: "right", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{e.submissionsCount}</td>
                  <td data-label="Score" style={{ padding: "16px 24px", textAlign: "right", fontSize: 16, fontWeight: 800, color: "var(--purple)" }}>{e.score.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Search size={24} opacity={0.5} />
            </div>
            No employees match filters.
          </div>
        )}
      </div>
    </div>
  );
}
