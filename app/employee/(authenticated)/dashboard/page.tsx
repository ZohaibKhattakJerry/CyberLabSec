import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import {
  Briefcase, Users, Clock, CheckSquare, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Bell, Star,
  MessageSquare, FileText, User
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/employee/login");

  let employee: any;
  const now = new Date(); // MUST be outside try block
  let countAhead = 0, rawAnnouncements: any[] = [], myReceipts: any[] = [], activityLogs: any[] = [];
  try {
    employee = await prisma.employee.findUnique({
      where: { id: auth.sub },
      select: {
        id: true, name: true, email: true, designation: true,
        employeeCode: true, employmentType: true, tier: true,
        status: true, photoUrl: true, startDate: true, endDate: true,
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

    if (!employee) {
      throw new Error("Employee not found");
    }


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
        select: { id: true, title: true, message: true, scope: true, sentAt: true, isPinned: true, sentBy: { select: { name: true } } },
      }),
      prisma.announcementReadReceipt.findMany({ where: { employeeId: auth.sub }, select: { announcementId: true } }),
      prisma.activityLog.findMany({ where: { actorId: auth.sub }, orderBy: { timestamp: 'desc' }, take: 5, select: { id: true, action: true, timestamp: true } }),
    ]);
  } catch (err) {
    console.error('Dashboard error:', err);
    redirect('/employee/login');
  }

  const hour = new Date().getUTCHours() + 5; // UTC+5
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = employee.name.split(" ")[0];

  const myMonthlyRank = countAhead + 1;

  const isIntern = employee.employmentType === "Intern";
  const daysRemaining = employee.endDate ? differenceInDays(employee.endDate, now) : 0;
  const tenureMonths = differenceInMonths(now, employee.startDate);

  const allTasks = employee.team?.tasks || [];
  const completedTasks = allTasks.filter((t) => t.submissions.some((s) => s.status === "Approved")).length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pendingTasks = allTasks.filter((t) => !t.submissions.some((s) => s.status === "Approved"));
  
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
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up 0.4s ease-out backwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        
        .glass-card {
          background: rgba(15, 20, 35, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--purple);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
          transform: scale(1.02);
        }

        .task-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .task-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }
        
        .hero-banner {
          position: relative;
          background: linear-gradient(135deg, rgba(15,20,35,0.8) 0%, rgba(30,20,50,0.8) 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(168,85,247,0.3);
          box-shadow: 0 0 40px rgba(168,85,247,0.1);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .hero-banner::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 60%);
          animation: pulse-glow 8s infinite alternate;
          z-index: 0;
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        .hero-content {
          position: relative;
          z-index: 1;
        }
        
        .progress-circle {
          width: 60px; height: 60px;
          border-radius: 50%;
          background: conic-gradient(var(--purple) calc(var(--p) * 1%), rgba(255,255,255,0.1) 0);
          display: flex; align-items: center; justify-content: center;
        }
        .progress-inner {
          width: 50px; height: 50px;
          background: var(--bg-base);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px;
        }
      `}} />

      {/* Hero Welcome Banner */}
      <div className="hero-banner fade-up">
        <div className="hero-content" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {greeting}, <span style={{ background: 'linear-gradient(90deg, #A855F7, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}</span> 👋
            </h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                ID: {employee.employeeCode}
              </span>
              <span style={{ background: isIntern ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)', color: isIntern ? 'var(--purple)' : 'var(--blue)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {employee.employmentType}
              </span>
              <span style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--amber)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {employee.tier} Tier
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {isIntern ? 'Internship Ends In' : 'Tenure'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isIntern ? `${daysRemaining} Days` : `${tenureMonths} Months`}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="progress-circle" style={{ '--p': progressPercent } as React.CSSProperties}>
                <div className="progress-inner">{progressPercent}%</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Task<br/>Completion
              </div>
            </div>

            <Link href="/employee/announcements" style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%', color: 'var(--text-primary)', transition: 'transform 0.2s' }}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--red)', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="fade-up delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard 
          icon={<Trophy size={20} color="var(--amber)" />} 
          label="Rank" 
          value={`#${myMonthlyRank}`} 
          sub="This Month" 
        />
        <StatCard 
          icon={<Star size={20} color="var(--purple)" />} 
          label="Points" 
          value={String(employee.points)} 
          sub={`${employee.monthlyPoints} this month`} 
        />
        <StatCard 
          icon={<CheckSquare size={20} color="var(--green)" />} 
          label="Tasks" 
          value={`${completedTasks}/${totalTasks}`} 
          sub="Completed / Total" 
        />
        <StatCard 
          icon={<Clock size={20} color="var(--blue)" />} 
          label={isIntern ? "Days Left" : "Tenure"} 
          value={isIntern ? String(daysRemaining) : `${tenureMonths} mo`} 
          sub={isIntern ? "Until internship ends" : "Total time with us"} 
        />
      </div>

      {/* My Objectives */}
      <div className="glass-card fade-up delay-1" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={20} color="var(--blue)" /> My Objectives
          </h2>
          <Link href="/employee/tasks" style={{ fontSize: '14px', color: 'var(--purple)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            View All Tasks <ArrowRight size={14} />
          </Link>
        </div>

        {employee.team && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <span>Team Overall Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--blue), var(--purple))', transition: 'width 1s ease-in-out' }} />
            </div>
          </div>
        )}

        {pendingTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <ShieldCheck size={48} color="var(--green)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>All caught up!</p>
            <p style={{ color: 'var(--text-muted)' }}>You have completed all assigned tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingTasks.map((task: any) => {
              const days = differenceInDays(task.deadline, now);
              const isOverdue = days < 0;
              const isDueSoon = days >= 0 && days <= 3;
              const borderColor = isOverdue ? 'var(--red)' : isDueSoon ? 'var(--amber)' : 'rgba(255,255,255,0.1)';
              const iconColor = isOverdue ? 'var(--red)' : isDueSoon ? 'var(--amber)' : 'var(--blue)';

              return (
                <Link key={task.id} href={`/employee/tasks/${task.id}`} className="task-card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: `rgba(${isOverdue ? '239,68,68' : isDueSoon ? '245,158,11' : '59,130,246'}, 0.1)`, padding: '10px', borderRadius: '8px' }}>
                      <Clock size={20} color={iconColor} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '15px' }}>{task.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {isOverdue ? `Overdue by ${Math.abs(days)} days` : days === 0 ? 'Due today' : `Due in ${days} days`}
                        <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                        <span style={{ color: 'var(--amber)' }}>{task.pointValue} Points</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: `rgba(${isOverdue ? '239,68,68' : isDueSoon ? '245,158,11' : '255,255,255'}, 0.1)`, color: isOverdue ? 'var(--red)' : isDueSoon ? 'var(--amber)' : 'var(--text-primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    {isOverdue ? 'Overdue' : isDueSoon ? 'Urgent' : 'Upcoming'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column Grid */}
      <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left: Performance & Badges */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Star size={18} color="var(--amber)" /> Performance & Rewards
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--amber)' }}>#{myMonthlyRank}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Rank</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{employee.monthlyPoints}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This Month</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--purple)' }}>{employee.points}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All Time</div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>Badges Earned</h3>
            {employee.badges.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {employee.badges.map((b: any) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', boxShadow: '0 2px 10px rgba(168,85,247,0.1)' }}>
                    <span>{BADGE_ICONS[b.type] || "🏅"}</span> {b.label}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No badges earned yet.</div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>Recent Earnings</h3>
            {employee.pointTransactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {employee.pointTransactions.map((tx: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{tx.reason.replace("Task approved: ", "").split(" (")[0]}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{tx.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No recent points.</div>
            )}
          </div>
        </div>

        {/* Right: Latest Announcements */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Bell size={18} color="var(--purple)" /> Announcements
              {unreadCount > 0 && (
                <span style={{ background: 'var(--amber)', color: '#000', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                  {unreadCount} New
                </span>
              )}
            </h2>
            <Link href="/employee/announcements" style={{ fontSize: '13px', color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.slice(0,3).map((a: any) => {
              const isUnread = !readSet.has(a.id);
              return (
                <div key={a.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: `3px solid ${a.isPinned ? 'var(--amber)' : 'var(--purple)'}`, border: isUnread ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  {isUnread && <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--purple)', boxShadow: '0 0 8px var(--purple)' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {a.isPinned && <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.2)', color: 'var(--amber)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>📌 Pinned</span>}
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{a.scope}</span>
                  </div>
                  <h4 style={{ fontSize: '15px', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{a.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {a.message.length > 80 ? a.message.slice(0, 80) + '...' : a.message}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    From {a.sentBy?.name ?? 'CyberLabSec'} • {format(new Date(a.sentAt), 'MMM d, yyyy')}
                  </div>
                </div>
              );
            })}
            {announcements.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No announcements.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid & Activity Timeline */}
      <div className="fade-up delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Zap size={18} color="var(--amber)" /> Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Link href="/employee/tasks" className="action-btn">
              <CheckSquare size={18} color="var(--blue)" /> My Tasks
            </Link>
            <Link href="/employee/team" className="action-btn">
              <MessageSquare size={18} color="var(--purple)" /> Team Chat
            </Link>
            <Link href="/employee/leaderboard" className="action-btn">
              <Trophy size={18} color="var(--amber)" /> Leaderboard
            </Link>
            <Link href="/employee/announcements" className="action-btn">
              <Bell size={18} color="var(--green)" /> Announcements
            </Link>
            <Link href="/employee/documents" className="action-btn">
              <FileText size={18} color="var(--text-muted)" /> My Documents
            </Link>
            <Link href="/employee/profile" className="action-btn">
              <User size={18} color="var(--text-primary)" /> My Profile
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Activity size={18} color="var(--green)" /> Recent Activity
          </h2>
          {activityLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
              {activityLogs.map((log: any, i: number) => (
                <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-base)', border: `2px solid ${log.action.includes('LOGIN') ? 'var(--green)' : log.action.includes('TASK') ? 'var(--blue)' : 'var(--purple)'}`, marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px', fontWeight: 500 }}>
                      {log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {format(new Date(log.timestamp), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No recent activity.</div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
        {icon} {label}
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>
      </div>
    </div>
  );
}
