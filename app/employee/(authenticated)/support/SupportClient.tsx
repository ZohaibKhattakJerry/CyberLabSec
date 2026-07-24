"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, LifeBuoy, Loader2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'badge-blue',
  Medium: 'badge-amber',
  High: 'badge-red',
  Critical: 'badge-red',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Open: <Clock size={14} />,
  'In Progress': <AlertCircle size={14} />,
  Resolved: <CheckCircle size={14} />,
  Closed: <XCircle size={14} />,
};

const STATUS_COLOR: Record<string, string> = {
  Open: 'badge-amber',
  'In Progress': 'badge-blue',
  Resolved: 'badge-green',
  Closed: 'badge-gray',
};

export default function SupportClient({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'General', title: '', description: '', priority: 'Medium' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/employee/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets([data.ticket, ...tickets]);
      setShowForm(false);
      setForm({ category: 'General', title: '', description: '', priority: 'Medium' });
      toast.success('Support ticket submitted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Support Tickets</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Submit issues and track resolutions from the team</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* New Ticket Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <LifeBuoy size={20} color="var(--purple)" /> New Support Ticket
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['General', 'IT', 'HR', 'Payroll', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label label-required">Title</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief summary of your issue" required />
              </div>
              <div>
                <label className="label label-required">Description</label>
                <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Describe your issue in detail. Include any relevant steps, error messages, or context..." required />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={14} className="spin" /> Submitting...</> : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <LifeBuoy size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No tickets yet. Submit a ticket if you need help.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {tickets.map((t: any) => (
            <div key={t.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <LifeBuoy size={18} color="var(--purple)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{t.description.length > 120 ? t.description.slice(0, 120) + '…' : t.description}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${PRIORITY_COLORS[t.priority] || 'badge-gray'}`} style={{ fontSize: 11 }}>{t.priority}</span>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{t.category}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(t.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {t.response && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--green)', fontSize: 12 }}>Response: </span>{t.response}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span className={`badge ${STATUS_COLOR[t.status] || 'badge-gray'}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {STATUS_ICON[t.status]} {t.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
