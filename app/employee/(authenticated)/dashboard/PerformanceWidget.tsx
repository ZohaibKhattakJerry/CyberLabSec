"use client";
import { useEffect, useState } from 'react';
import { TrendingUp, Clock, CheckCircle, Award } from 'lucide-react';

interface PerformanceData {
  tasksCompleted: number;
  tasksOnTime: number;
  avgScore: number;
  attendanceRate: number;
  points: number;
  streak: number;
}

export default function PerformanceWidget() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employee/performance')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const metrics = [
    { label: 'Tasks Done', value: data.tasksCompleted, color: 'var(--green)', icon: <CheckCircle size={16} /> },
    { label: 'On Time', value: `${data.tasksOnTime}%`, color: 'var(--blue)', icon: <Clock size={16} /> },
    { label: 'Avg Score', value: `${data.avgScore}%`, color: 'var(--purple)', icon: <TrendingUp size={16} /> },
    { label: 'Points', value: data.points, color: 'var(--amber)', icon: <Award size={16} /> },
  ];

  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>My Performance</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 30 days</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: m.color, marginBottom: 6 }}>{m.icon}<span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
