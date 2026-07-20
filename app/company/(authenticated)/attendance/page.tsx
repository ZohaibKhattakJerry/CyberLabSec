import { prisma } from '@/lib/prisma';
import { getAuthFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CompanyAttendancePage() {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== 'admin') redirect('/company/login');

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const todayRecords = await (prisma as unknown).attendanceRecord.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    include: {
      employee: {
        select: {
          name: true,
          designation: true,
          employeeCode: true,
          team: { select: { name: true } },
        },
      },
    },
    orderBy: { loginTime: 'asc' },
  }).catch(() => []);

  const allEmployees = await prisma.employee.findMany({
    where: { status: 'Active' },
    select: { id: true, name: true, designation: true, employeeCode: true },
  });

  const presentIds = new Set(todayRecords.map((r: unknown) => r.employeeId));
  const absentEmployees = allEmployees.filter((e) => !presentIds.has(e.id));

  const presentCount = todayRecords.filter((r: unknown) => r.status === 'Present').length;
  const lateCount = todayRecords.filter((r: unknown) => r.status === 'Late').length;
  const absentCount = absentEmployees.length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Attendance Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Today: {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--green)' }}>{presentCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present</div>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--amber)' }}>{lateCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Late</div>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--red)' }}>{absentCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Absent</div>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--purple)' }}>
            {allEmployees.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Staff</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Present Today */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
            Present Today
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {todayRecords.length} employees
            </span>
          </h2>
          {todayRecords.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center', fontSize: 14 }}>
              No check-ins recorded today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayRecords.map((r: any) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.employee.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {r.employee.designation} · In: {format(new Date(r.loginTime), 'h:mm a')}
                      {r.logoutTime && ` · Out: ${format(new Date(r.logoutTime), 'h:mm a')}`}
                    </div>
                  </div>
                  <span className={`badge ${r.status === 'Present' ? 'badge-green' : 'badge-amber'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Absent Today */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
            Absent Today
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {absentCount} employees
            </span>
          </h2>
          {absentEmployees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center', fontSize: 14 }}>
              🎉 Full attendance today!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {absentEmployees.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {e.designation} · {e.employeeCode}
                    </div>
                  </div>
                  <span className="badge badge-red">Absent</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
