"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaveClient({ initialLeaves }: { initialLeaves: any[] }) {
  const [leaves, setLeaves] = useState<any[]>(initialLeaves);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      toast.error('All fields required'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/employee/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeaves([data.leave, ...leaves]);
      setShowForm(false);
      setForm({ type: 'Casual', startDate: '', endDate: '', reason: '' });
      toast.success('Leave request submitted!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) =>
    s === 'Approved' ? 'badge-green' :
    s === 'Rejected' ? 'badge-red' :
    s === 'Cancelled' ? 'badge-gray' : 'badge-amber';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Leave Requests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Submit and track your leave applications</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Request Leave
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>New Leave Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="label">Leave Type</label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['Casual', 'Medical', 'Annual', 'Unpaid', 'Emergency'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label label-required">Start Date</label>
                  <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label label-required">End Date</label>
                  <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label label-required">Reason</label>
                <textarea className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={4} placeholder="Briefly explain your reason for leave..." required />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={14} className="spin" /> Submitting...</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {leaves.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No leave requests yet. Submit your first request above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {leaves.map((l: any) => (
            <div key={l.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={20} color="var(--purple)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{l.type} Leave</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {format(new Date(l.startDate), 'MMM d')} — {format(new Date(l.endDate), 'MMM d, yyyy')} · {l.totalDays} day{l.totalDays !== 1 ? 's' : ''}
                  </div>
                  {l.reviewerNote && <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>Note: {l.reviewerNote}</div>}
                </div>
              </div>
              <span className={`badge ${statusColor(l.status)}`} style={{ flexShrink: 0 }}>{l.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
