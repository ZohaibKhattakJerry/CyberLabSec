import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const auth = await getAuthFromCookies("employee");
  if (!auth) redirect('/employee/login');

  const pstString = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const now = new Date(pstString);
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
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Check In</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Check Out</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records found for this month.</td></tr>
            ) : (
              records.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 500 }}>{format(new Date(r.date), 'EEE, MMM d, yyyy')}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{format(new Date(r.loginTime), 'h:mm a')}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{r.logoutTime ? format(new Date(r.logoutTime), 'h:mm a') : '--'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${r.status === 'Present' ? 'badge-green' : r.status === 'Late' ? 'badge-amber' : 'badge-red'}`}>{r.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
