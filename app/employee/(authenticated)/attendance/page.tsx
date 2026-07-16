import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect('/employee/login');

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const records = await (prisma as any).attendanceRecord.findMany({
    where: {
      employeeId: auth.sub,
      date: { gte: monthStart, lte: monthEnd }
    },
    orderBy: { date: 'desc' }
  }).catch(() => []);

  const presentCount = records.filter((r: any) => r.status === 'Present').length;
  const lateCount = records.filter((r: any) => r.status === 'Late').length;
  const totalWorkDays = records.length;

  // Serialize dates
  const serializedRecords = records.map((r: any) => ({
    ...r,
    date: r.date.toISOString(),
    loginTime: r.loginTime.toISOString(),
    logoutTime: r.logoutTime?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>My Attendance</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>{format(now, 'MMMM yyyy')} record</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Present', value: presentCount, color: 'var(--green)', icon: <CheckCircle size={20} /> },
          { label: 'Late', value: lateCount, color: 'var(--amber)', icon: <AlertTriangle size={20} /> },
          { label: 'Total Logged', value: totalWorkDays, color: 'var(--purple)', icon: <Calendar size={20} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Attendance Log</h2>
        {serializedRecords.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No attendance records found for this month.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {serializedRecords.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.status === 'Present' ? 'var(--green)' : r.status === 'Late' ? 'var(--amber)' : 'var(--red)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{format(new Date(r.date), 'EEEE, MMM d')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Login: {format(new Date(r.loginTime), 'h:mm a')}
                      {r.logoutTime && ` · Logout: ${format(new Date(r.logoutTime), 'h:mm a')}`}
                    </div>
                  </div>
                </div>
                <span className={`badge ${r.status === 'Present' ? 'badge-green' : r.status === 'Late' ? 'badge-amber' : 'badge-red'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
