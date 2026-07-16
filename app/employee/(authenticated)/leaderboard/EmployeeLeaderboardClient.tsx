"use client";

import { useState } from "react";
import { Trophy, Info, X } from "lucide-react";

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
  submissions: { id: string; submittedAt: string; reviewedAt: string | null }[];
};

const BADGE_ICONS: Record<string, string> = {
  FirstTask: "🎯",
  TenTasks: "🔟",
  PerfectMonth: "⭐",
  TopPerformer: "🏆",
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
  myBadges: Badge[];
  myCompletedTasks: number;
  myOnTimeRate: number;
}) {
  const [view, setView] = useState<"monthly" | "alltime">("monthly");
  const [showInfo, setShowInfo] = useState(false);

  const sorted = [...employees].sort((a, b) =>
    view === "monthly" ? b.monthlyPoints - a.monthlyPoints : b.points - a.points
  );

  const myIndex = sorted.findIndex((e) => e.id === myEmployeeId);
  const myRank = myIndex + 1;
  const myPoints = view === "monthly" ? myMonthlyPoints : myTotalPoints;

  const top3 = sorted.slice(0, 3);
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder =
    top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  const podiumConfig = [
    { medal: "🥈", height: 80, color: "#94a3b8", glow: "rgba(148,163,184,0.25)" },
    { medal: "🥇", height: 112, color: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
    { medal: "🥉", height: 56, color: "#cd7f32", glow: "rgba(205,127,50,0.25)" },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <Trophy size={24} color="var(--amber)" /> Reputation Leaderboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Reputation XP rankings based on approved tasks and quality ratings.
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="btn btn-secondary btn-sm"
        >
          <Info size={14} /> How XP Works
        </button>
      </div>

      {/* Points info */}
      {showInfo && (
        <div
          className="card animate-fade-up"
          style={{
            padding: 20,
            marginBottom: 24,
            border: "1px solid var(--border-accent)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--purple)", margin: 0 }}>
              How XP Is Calculated
            </h3>
            <button
              onClick={() => setShowInfo(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
            >
              <X size={16} />
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Base XP (by priority)
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div>🟢 Low task = <strong>10 XP</strong></div>
                <div>🔵 Medium task = <strong>20 XP</strong></div>
                <div>🟡 High task = <strong>35 XP</strong></div>
                <div>🔴 Critical task = <strong>50 XP</strong></div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Bonus XP
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div>⏰ On-time submission = <strong>+20%</strong></div>
                <div>⭐ Quality rating (1–5★) = <strong>×5 XP each</strong></div>
                <div>🔄 Resubmissions = <strong>no extra XP</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Stats */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 28,
          background: "rgba(168,85,247,0.05)",
          border: "1px solid rgba(168,85,247,0.2)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--purple)",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          My Stats
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 16,
            marginBottom: myBadges.length > 0 ? 16 : 0,
          }}
        >
          {[
            { value: `#${myRank}`, label: "My Rank", color: "var(--amber)" },
            { value: myPoints, label: "Total XP", color: "var(--text-primary)" },
            { value: myCompletedTasks, label: "Tasks Done", color: "var(--green)" },
            { value: `${myOnTimeRate}%`, label: "On Time", color: "var(--blue)" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {myBadges.length > 0 && (
          <div
            style={{
              paddingTop: 16,
              borderTop: "1px solid rgba(168,85,247,0.15)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
              Earned Badges
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {myBadges.map((b) => (
                <div
                  key={b.type}
                  title={b.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    background: "rgba(168,85,247,0.1)",
                    border: "1px solid rgba(168,85,247,0.25)",
                    borderRadius: 20,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{BADGE_ICONS[b.type] || "🏅"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="tab-group">
          <button
            className={`tab-item ${view === "monthly" ? "active" : ""}`}
            onClick={() => setView("monthly")}
          >
            This Month
          </button>
          <button
            className={`tab-item ${view === "alltime" ? "active" : ""}`}
            onClick={() => setView("alltime")}
          >
            All Time
          </button>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {sorted.length} employees
        </div>
      </div>

      {/* Podium */}
      {top3.length >= 2 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 16,
            marginBottom: 32,
            padding: "0 16px",
          }}
        >
          {podiumOrder.map((emp, i) => {
            if (!emp) return null;
            const pc = podiumConfig[i];
            const isMe = emp.id === myEmployeeId;
            const pts = view === "monthly" ? emp.monthlyPoints : emp.points;
            return (
              <div
                key={emp.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0,
                  maxWidth: 140,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{pc.medal}</div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: isMe
                      ? "rgba(168,85,247,0.15)"
                      : `${pc.glow}`,
                    border: `2px solid ${isMe ? "var(--purple)" : pc.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    color: isMe ? "var(--purple)" : pc.color,
                    marginBottom: 8,
                    boxShadow: isMe
                      ? "0 0 20px rgba(168,85,247,0.35)"
                      : `0 0 15px ${pc.glow}`,
                  }}
                >
                  {emp.name[0].toUpperCase()}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: isMe ? "var(--purple)" : "var(--text-primary)",
                    textAlign: "center",
                    marginBottom: 2,
                    width: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.name.split(" ")[0]}
                  {isMe ? " (You)" : ""}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: pc.color,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {pts} XP
                </div>
                <div
                  style={{
                    background: pc.color,
                    width: "100%",
                    height: pc.height,
                    borderRadius: "6px 6px 0 0",
                    opacity: 0.12,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 600,
            display: "grid",
            gridTemplateColumns: "32px 1fr 50px 60px",
            gap: 8,
          }}
        >
          <span>#</span>
          <span>Employee</span>
          <span style={{ textAlign: "center" }}>Badges</span>
          <span style={{ textAlign: "right" }}>XP</span>
        </div>

        {sorted.map((emp, i) => {
          const isMe = emp.id === myEmployeeId;
          const pts = view === "monthly" ? emp.monthlyPoints : emp.points;
          return (
            <div
              key={emp.id}
              id={isMe ? "my-rank-row" : undefined}
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "grid",
                gridTemplateColumns: "32px 1fr 50px 60px",
                gap: 8,
                alignItems: "center",
                background: isMe ? "rgba(168,85,247,0.06)" : "transparent",
                borderLeft: isMe
                  ? "3px solid var(--purple)"
                  : "3px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color:
                    i === 0
                      ? "var(--amber)"
                      : i === 1
                      ? "#94a3b8"
                      : i === 2
                      ? "#cd7f32"
                      : "var(--text-muted)",
                }}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: isMe ? 700 : 500,
                    fontSize: 14,
                    color: isMe ? "var(--purple)" : "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {emp.name}
                  {isMe && (
                    <span className="badge badge-purple" style={{ fontSize: 9 }}>
                      You
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {emp.designation}
                  {emp.team ? ` · ${emp.team.name}` : ""}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                {emp.badges.slice(0, 3).map((b) => (
                  <span key={b.type} title={b.label} style={{ fontSize: 14 }}>
                    {BADGE_ICONS[b.type] || "🏅"}
                  </span>
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: isMe ? "var(--purple)" : i < 3 ? "var(--amber)" : "var(--text-primary)",
                  }}
                >
                  {pts}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>XP</div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            No active employees yet.
          </div>
        )}
      </div>
    </div>
  );
}
