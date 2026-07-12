"use client";

import { useState } from "react";
import { Trophy, Medal, Award, Search, ChevronDown } from "lucide-react";

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

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 200 }} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="All">All Teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: 80, textAlign: "center" }}>Rank</th>
              <th>Employee</th>
              <th>Role</th>
              <th>Team</th>
              <th style={{ textAlign: "right" }}>Approved Tasks</th>
              <th style={{ textAlign: "right", paddingRight: 24 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, index) => {
              const rank = index + 1;
              let RankIcon = null;
              if (rank === 1) RankIcon = <Trophy size={18} color="#fbbf24" />;
              else if (rank === 2) RankIcon = <Medal size={18} color="#94a3b8" />;
              else if (rank === 3) RankIcon = <Award size={18} color="#b45309" />;

              return (
                <tr key={e.id} style={{ background: rank <= 3 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td data-label="Rank" style={{ textAlign: "center", fontWeight: 800, fontSize: 16, color: rank <= 3 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {RankIcon ? <div style={{ display: "flex", justifyContent: "center" }}>{RankIcon}</div> : `#${rank}`}
                  </td>
                  <td data-label="Employee">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                    {e.tier === "Executive" && <div style={{ fontSize: 11, color: "var(--amber)" }}>Executive</div>}
                    {e.tier === "Lead" && <div style={{ fontSize: 11, color: "var(--blue)" }}>Team Lead</div>}
                  </td>
                  <td data-label="Role" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{e.designation}</td>
                  <td data-label="Team"><span className="badge badge-gray">{e.teamName}</span></td>
                  <td data-label="Approved Tasks" style={{ textAlign: "right", fontSize: 14, fontWeight: 500 }}>{e.submissionsCount}</td>
                  <td data-label="Score" style={{ textAlign: "right", paddingRight: 24, fontSize: 16, fontWeight: 700, color: "var(--purple)" }}>{e.score.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No employees match filters.</div>
        )}
      </div>
    </div>
  );
}
