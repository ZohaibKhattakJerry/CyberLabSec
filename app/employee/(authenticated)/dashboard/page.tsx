import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInCalendarDays, differenceInMonths } from "date-fns";
import {
  Briefcase, Users, Clock, CheckSquare, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Bell, Star,
  MessageSquare, FileText, User, TrendingUp, Award
} from "lucide-react";
import Link from "next/link";
import CompletionDialog from "./CompletionDialog";
import React from "react";
import DashboardGreeting from "@/components/DashboardGreeting";

export const dynamic = "force-dynamic";

function differenceInDays(a: Date, b: Date) {
  return Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function Dashboard() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect("/employee/login");

  let employee: any;
  const now = new Date();
  let countAhead = 0, rawAnnouncements: any[] = [], myReceipts: any[] = [], activityLogs: any[] = [];
  try {
    employee = await prisma.employee.findUnique({
      where: { id: auth.sub },
      select: {
        id: true, name: true, email: true, designation: true,
        employeeCode: true, employmentType: true, tier: true,
        status: true, photoUrl: true, startDate: true, endDate: true,
        completionNotified: true,
        points: true, monthlyPoints: true, teamId: true,
        team: {
          select: {
            id: true, name: true,
            members: { select: { id: true, name: true, designation: true, status: true }, where: { status: "Active" } },
            tasks: {
              select: { 
                id: true, title: true, deadline: true, status: true, 
                submissions: { where: { employeeId: auth.sub }, select: { status: true } } 
              },
              orderBy: { deadline: 'asc' },
            },
          },
        },
        badges: { orderBy: { awardedAt: 'desc' }, take: 5, select: { id: true, type: true, label: true, awardedAt: true } },
        pointTransactions: { orderBy: { createdAt: 'desc' }, take: 3, select: { points: true, reason: true, createdAt: true } },
      },
    });

    if (!employee) throw new Error("Employee not found");

    [countAhead, rawAnnouncements, myReceipts, activityLogs] = await Promise.all([
      prisma.employee.count({ where: { status: 'Active', monthlyPoints: { gt: employee.monthlyPoints } } }),
      prisma.announcement.findMany({
        where: { 
          OR: [
            { scope: "Company" },
            { scope: "Team", teamId: employee.teamId || undefined },
            { scope: "Individual", employeeId: auth.sub },
          ],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
          sentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        },
        orderBy: { sentAt: 'desc' }, take: 5,
        select: { id: true, message: true, scope: true, sentAt: true, isPinned: true, sentBy: { select: { name: true } } },
      }),
      prisma.announcementReadReceipt.findMany({ where: { employeeId: auth.sub }, select: { announcementId: true } }),
      prisma.activityLog.findMany({ where: { actorId: auth.sub }, orderBy: { timestamp: 'desc' }, take: 5, select: { id: true, action: true, timestamp: true } }),
    ]);
  } catch (err: any) {
    console.error('Dashboard error:', err);
    redirect('/employee/login');
  }

  const firstName = employee.name.split(" ")[0];

  const myMonthlyRank = countAhead + 1;
  const isIntern = employee.employmentType === "Intern";
  const startsInDays = differenceInCalendarDays(employee.startDate, now);
  const isFutureStart = startsInDays > 0;
  
  let daysRemaining = 0;
  let isCompleted = false;

  if (employee.endDate) {
    daysRemaining = differenceInCalendarDays(employee.endDate, now);
    if (!isFutureStart && daysRemaining <= 0) { isCompleted = true; daysRemaining = 0; }
  } else {
    isCompleted = true; daysRemaining = 0;
  }

  const tenureMonths = differenceInMonths(now, employee.startDate);
  const allTasks = employee.team?.tasks || [];
  const completedTasks = allTasks.filter((t: any) => t.submissions.some((s: any) => s.status === "Approved")).length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = allTasks.filter((t: any) => !t.submissions.some((s: any) => s.status === "Approved"));
  
  const announcements = [...rawAnnouncements].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  const readSet = new Set(myReceipts.map((r) => r.announcementId));
  const unreadAnnouncements = announcements.filter((a) => !readSet.has(a.id));
  const unreadCount = unreadAnnouncements.length;

  const BADGE_ICONS: Record<string, string> = {
    FirstTask: "🎯", TenTasks: "🔟", PerfectMonth: "⭐", TopPerformer: "🏆",
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* === ANIMATIONS === */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.9) translate(-50%,-50%); opacity: 0.4; }
          100% { transform: scale(1.15) translate(-50%,-50%); opacity: 0.8; }
        }
        @keyframes shimmer-badge {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .fade-up { animation: fade-up 0.5s ease-out backwards; }
        .delay-1 { animation-delay: 0.08s; }
        .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; }
        .delay-4 { animation-delay: 0.32s; }

        /* === HERO BANNER === */
        .dash-hero {
          position: relative;
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 20px;
          background: linear-gradient(135deg, rgba(12,8,28,0.95) 0%, rgba(26,14,55,0.95) 50%, rgba(12,8,28,0.95) 100%);
          border: 1px solid rgba(168,85,247,0.25);
          box-shadow: 0 0 40px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .dash-hero-glow {
          position: absolute;
          top: 50%; left: 50%;
          width: 70%;
          height: 70%;
          background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
          animation: pulse-glow 8s infinite alternate;
          pointer-events: none;
          border-radius: 50%;
        }
        .dash-hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }
        .dash-hero-content { position: relative; z-index: 2; }

        /* === STAT CARDS === */
        .stat-card {
          background: rgba(15,20,35,0.5);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          -webkit-tap-highlight-color: transparent;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(168,85,247,0.25);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(168,85,247,0.08);
        }
        .stat-card:active {
          transform: scale(0.98) translateY(0);
          box-shadow: none;
        }

        /* === GLASS CARD === */
        .glass-card {
          background: rgba(15,20,35,0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .glass-card:hover {
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }

        /* === ACTION BUTTONS === */
        .action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .action-btn:hover {
          background: rgba(168,85,247,0.08);
          border-color: rgba(168,85,247,0.35);
          box-shadow: 0 0 20px rgba(168,85,247,0.12);
          transform: translateY(-1px);
        }
        .action-btn:active {
          transform: scale(0.96);
          background: rgba(168,85,247,0.12);
          box-shadow: none;
        }

        /* === TASK CARD === */
        .task-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s ease;
          text-decoration: none;
          gap: 12px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .task-card:hover {
          background: rgba(255,255,255,0.05);
          transform: translateX(3px);
        }
        .task-card:active {
          transform: scale(0.98);
          background: rgba(255,255,255,0.07);
        }

        /* === PROGRESS CIRCLE === */
        .progress-circle {
          width: 58px; height: 58px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .progress-inner {
          width: 46px; height: 46px;
          background: rgba(5,3,12,0.9);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px;
          color: var(--text-primary);
        }

        /* === BADGE PILL === */
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(168,85,247,0.12);
          border: 1px solid rgba(168,85,247,0.28);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(168,85,247,0.08);
        }

        /* === ANNOUNCEMENT CARD === */
        .ann-card {
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border-left: 3px solid var(--border);
          border-top: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
          transition: background 0.2s ease;
        }
        .ann-card:hover { background: rgba(255,255,255,0.04); }

        /* === HERO RESPONSIVE === */
        .hero-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .hero-stats-row {
          display: flex;
          align-items: center;
          gap: clamp(16px, 3vw, 28px);
          flex-wrap: wrap;
        }

        @media (max-width: 600px) {
          .hero-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-stats-row {
            width: 100%;
            justify-content: space-between;
          }
          .dash-hero-title {
            font-size: 24px !important;
          }
        }

        /* === STATS GRID === */
        .stats-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .stats-grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .stats-grid-4 {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        /* === TWO-COL GRID === */
        .two-col-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        /* === ACTIONS GRID === */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 600px) {
          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 360px) {
          .actions-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* === TOUCH RIPPLE (global) === */
        * { box-sizing: border-box; }
      `}} />

      <CompletionDialog 
        isCompleted={isCompleted} 
        completionNotified={employee.completionNotified} 
        employmentType={employee.employmentType} 
      />


      {/* ── HERO BANNER ── */}
      <div className="dash-hero fade-up">
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
          <div className="dash-hero-glow" />
          <div className="dash-hero-grid" />
        </div>
        <div className="dash-hero-content">
          <div className="hero-row">
            {/* Left: greeting + badges */}
            <div>
              <DashboardGreeting firstName={firstName} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  ID: {employee.employeeCode}
                </span>
                <span style={{ background: isIntern ? 'rgba(168,85,247,0.18)' : 'rgba(59,130,246,0.18)', color: isIntern ? 'var(--purple)' : 'var(--blue)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  {employee.employmentType}
                </span>
                <span style={{ background: 'rgba(245,158,11,0.18)', color: 'var(--amber)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  {employee.tier} Tier
                </span>
              </div>
            </div>

            {/* Right: stats + notification */}
            <div className="hero-stats-row">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {isFutureStart ? 'Starts In' : (employee.endDate ? 'Days Left' : 'Tenure')}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {isFutureStart ? `${startsInDays}d` : (employee.endDate ? `${daysRemaining}d` : `${tenureMonths}mo`)}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="progress-circle" style={{ background: `conic-gradient(var(--purple) calc(${progressPercent} * 1%), rgba(255,255,255,0.08) 0)` }}>
                  <div className="progress-inner">{progressPercent}%</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Task<br/>Done
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div className="stats-grid-4 fade-up delay-1" style={{ marginBottom: 20 }}>
        <StatCard 
          icon={<Trophy size={18} color="var(--amber)" />} 
          iconBg="rgba(245,158,11,0.1)"
          label="Rank" 
          value={`#${myMonthlyRank}`} 
          sub="This Month"
          accent="var(--amber)"
        />
        <StatCard 
          icon={<Star size={18} color="var(--purple)" />}
          iconBg="rgba(168,85,247,0.1)"
          label="Points" 
          value={String(employee.points)} 
          sub={`${employee.monthlyPoints} this month`}
          accent="var(--purple)"
        />
        <StatCard 
          icon={<CheckSquare size={18} color="var(--green)" />}
          iconBg="rgba(34,197,94,0.1)"
          label="Tasks" 
          value={`${completedTasks}/${totalTasks}`} 
          sub="Completed"
          accent="var(--green)"
        />
        <StatCard 
          icon={<Clock size={18} color="var(--blue)" />}
          iconBg="rgba(59,130,246,0.1)"
          label={isIntern ? "Days Left" : "Tenure"} 
          value={isIntern ? String(daysRemaining) : `${tenureMonths} mo`} 
          sub={isIntern ? "Until internship ends" : "With CyberLabSec"}
          accent="var(--blue)"
        />
      </div>

      {/* ── MY OBJECTIVES ── */}
      <div className="glass-card fade-up delay-2" style={{ padding: 'clamp(16px,3vw,24px)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <CheckSquare size={18} color="var(--blue)" /> My Objectives
          </h2>
          <Link href="/employee/tasks" style={{ fontSize: 13, color: 'var(--purple)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {employee.team && totalTasks > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 8, color: 'var(--text-muted)', fontWeight: 600 }}>
              <span>Overall Progress</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{progressPercent}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--blue), var(--purple))', transition: 'width 1.2s ease-in-out', borderRadius: 4 }} />
            </div>
          </div>
        )}

        {pendingTasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(34,197,94,0.04)', borderRadius: 12, border: '1px dashed rgba(34,197,94,0.2)' }}>
            <ShieldCheck size={40} color="var(--green)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>All caught up!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>You've completed all assigned tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingTasks.slice(0, 4).map((task: any) => {
              const days = differenceInDays(task.deadline, now);
              const isOverdue = days < 0;
              const isDueSoon = days >= 0 && days <= 3;
              const borderColor = isOverdue ? 'var(--red)' : isDueSoon ? 'var(--amber)' : 'rgba(59,130,246,0.4)';
              const badgeBg = isOverdue ? 'rgba(239,68,68,0.12)' : isDueSoon ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.08)';
              const badgeColor = isOverdue ? 'var(--red)' : isDueSoon ? 'var(--amber)' : 'var(--blue)';

              return (
                <Link key={task.id} href={`/employee/tasks/${task.id}`} className="task-card" style={{ borderLeft: `3px solid ${borderColor}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div style={{ background: badgeBg, padding: '9px', borderRadius: 8, flexShrink: 0 }}>
                      <Clock size={16} color={badgeColor} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {isOverdue ? `Overdue by ${Math.abs(days)}d` : days === 0 ? 'Due today' : `Due in ${days}d`}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {isOverdue ? 'Overdue' : isDueSoon ? 'Urgent' : 'Open'}
                  </div>
                </Link>
              );
            })}
            {pendingTasks.length > 4 && (
              <Link href="/employee/tasks" style={{ textAlign: 'center', fontSize: 13, color: 'var(--purple)', textDecoration: 'none', padding: '10px', fontWeight: 600 }}>
                +{pendingTasks.length - 4} more tasks →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── PERFORMANCE + ANNOUNCEMENTS ── */}
      <div className="two-col-grid fade-up delay-3" style={{ marginBottom: 20 }}>
        
        {/* Performance & Badges */}
        <div className="glass-card" style={{ padding: 'clamp(16px,3vw,24px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Star size={17} color="var(--amber)" /> Performance & Rewards
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '14px 12px', borderRadius: 12 }}>
            {[
              { label: 'Monthly Rank', value: `#${myMonthlyRank}`, color: 'var(--amber)' },
              { label: 'This Month', value: String(employee.monthlyPoints), color: 'var(--text-primary)' },
              { label: 'All Time', value: String(employee.points), color: 'var(--purple)' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 10, fontWeight: 700 }}>Badges Earned</h3>
            {employee.badges.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {employee.badges.map((b: any) => (
                  <div key={b.id} className="badge-pill">
                    <span>{BADGE_ICONS[b.type] || "🏅"}</span> {b.label}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No badges yet — keep going!</div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 10, fontWeight: 700 }}>Recent Earnings</h3>
            {employee.pointTransactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {employee.pointTransactions.map((tx: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, paddingBottom: 8, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 8 }}>{tx.reason.replace("Task approved: ", "").split(" (")[0]}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0 }}>+{tx.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No recent points.</div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div id="tour-announcements" className="glass-card" style={{ padding: 'clamp(16px,3vw,24px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Bell size={17} color="var(--purple)" /> Announcements
              {unreadCount > 0 && (
                <span style={{ background: 'var(--amber)', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: '12px', lineHeight: 1.4 }}>
                  {unreadCount}
                </span>
              )}
            </h2>
            <Link href="/employee/announcements" style={{ fontSize: 12, color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.slice(0, 3).map((a: any) => {
              const isUnread = !readSet.has(a.id);
              return (
                <div key={a.id} className="ann-card" style={{ '--border': a.isPinned ? 'var(--amber)' : 'rgba(168,85,247,0.35)' } as React.CSSProperties}>
                  {isUnread && <div style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', background: 'var(--purple)', boxShadow: '0 0 8px var(--purple)' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {a.isPinned && <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>📌 Pinned</span>}
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{a.scope}</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.55, fontWeight: 500 }}>
                    {a.message.length > 90 ? a.message.slice(0, 90) + '...' : a.message}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {a.sentBy?.name ?? 'CyberLabSec'} • {format(new Date(a.sentAt), 'MMM d, yyyy')}
                  </div>
                </div>
              );
            })}
            {announcements.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No announcements yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS + ACTIVITY ── */}
      <div className="two-col-grid fade-up delay-4">

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: 'clamp(16px,3vw,24px)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Zap size={17} color="var(--amber)" /> Quick Actions
          </h2>
          <div className="actions-grid">
            {[
              { href: "/employee/tasks", icon: <CheckSquare size={18} color="var(--blue)" />, label: "My Tasks" },
              { href: "/employee/team", icon: <MessageSquare size={18} color="var(--purple)" />, label: "Team Chat" },
              { href: "/employee/leaderboard", icon: <Trophy size={18} color="var(--amber)" />, label: "Leaderboard" },
              { href: "/employee/announcements", icon: <Bell size={18} color="var(--green)" />, label: "Announcements" },
              { href: "/employee/documents", icon: <FileText size={18} color="var(--text-muted)" />, label: "Documents" },
              { href: "/employee/profile", icon: <User size={18} color="var(--text-primary)" />, label: "My Profile" },
            ].map(({ href, icon, label }) => (
              <Link key={href} href={href} className="action-btn">
                {icon} 
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: 'clamp(16px,3vw,24px)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={17} color="var(--green)" /> Recent Activity
          </h2>
          {activityLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
              {activityLogs.map((log: any, i: number) => {
                const isLogin = log.action.includes('LOGIN');
                const isTask = log.action.includes('TASK');
                const dotColor = isLogin ? 'var(--green)' : isTask ? 'var(--blue)' : 'var(--purple)';
                return (
                  <div key={log.id} style={{ display: 'flex', gap: 14, position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: dotColor, marginTop: 3, flexShrink: 0, boxShadow: `0 0 8px ${dotColor}60`, border: '2px solid rgba(5,3,12,0.9)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {format(new Date(log.timestamp), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No recent activity.</div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, sub, accent, iconBg }: { 
  icon: React.ReactNode; label: string; value: string; sub: string; accent: string; iconBg: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ background: iconBg, padding: '8px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2 }}>{label}</div>
      </div>
      <div>
        <div style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 900, color: accent, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
}
