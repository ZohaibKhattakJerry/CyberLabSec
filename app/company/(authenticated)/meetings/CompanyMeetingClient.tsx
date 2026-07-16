"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Check, _X, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyMeetingClient({ initialMeetings }: { initialMeetings: unknown[] }) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<unknown>(null);
  const [form, setForm] = useState({ status: 'Confirmed', confirmedTime: '', meetingLink: '' });
  const [loading, setLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.status === 'Confirmed' && !form.confirmedTime) {
      toast.error('Please select a time to confirm');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/company/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: selectedMeeting.id, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMeetings(meetings.map(m => m.id === selectedMeeting.id ? data.meeting : m));
      setSelectedMeeting(null);
      toast.success('Meeting updated successfully!');
    } catch (err: unknown) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'Confirmed') return 'badge-green';
    if (s === 'Completed') return 'badge-blue';
    if (s === 'Cancelled') return 'badge-red';
    return 'badge-amber';
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Manage Meetings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Review, confirm, or cancel employee meeting requests</p>
      </div>

      {selectedMeeting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Update Meeting</h2>
            <form onSubmit={handleAction} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Voting', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {form.status === 'Confirmed' && (
                <>
                  <div>
                    <label className="label">Confirm Time</label>
                    <select className="input" value={form.confirmedTime} onChange={e => setForm({ ...form, confirmedTime: e.target.value })} required>
                      <option value="">Select a time slot</option>
                      {JSON.parse(selectedMeeting.proposedTimes || '[]').map((time: string) => (
                        <option key={time} value={time}>{isNaN(new Date(time).getTime()) ? time : format(new Date(time), 'MMM d, yyyy · h:mm a')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Meeting Link (Optional)</label>
                    <input type="url" className="input" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://zoom.us/..." />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedMeeting(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={14} className="spin" /> Updating...</> : 'Update Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No meetings have been requested.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {meetings.map((m: unknown) => {
            const proposedTimes = JSON.parse(m.proposedTimes || '[]');
            const votes = JSON.parse(m.votes || '{}');
            const voteCounts: Record<string, number> = {};
            proposedTimes.forEach((t: string) => voteCounts[t] = 0);
            Object.values(votes).forEach((t: unknown) => {
              if (voteCounts[t] !== undefined) voteCounts[t]++;
            });

            return (
              <div key={m.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{m.title}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Proposed by {m.proposer?.name} · Team: {m.team?.name || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${statusColor(m.status)}`}>{m.status}</span>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => {
                      setForm({ status: m.status !== 'Voting' ? m.status : 'Confirmed', confirmedTime: m.confirmedTime ? new Date(m.confirmedTime).toISOString() : '', meetingLink: m.meetingLink || '' });
                      setSelectedMeeting(m);
                    }}>
                      Manage
                    </button>
                  </div>
                </div>

                {m.description && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {m.description}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                  {proposedTimes.map((time: string, i: number) => {
                    const count = voteCounts[time] || 0;
                    const isConfirmed = m.status === 'Confirmed' && m.confirmedTime && new Date(m.confirmedTime).toISOString() === new Date(time).toISOString();
                    return (
                      <div key={i} style={{ 
                        padding: '12px 16px', 
                        borderRadius: 8, 
                        border: `1px solid ${isConfirmed ? 'var(--green)' : 'var(--border)'}`,
                        background: isConfirmed ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-secondary)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={16} color={isConfirmed ? 'var(--green)' : 'var(--text-secondary)'} />
                          <span style={{ fontSize: 14, fontWeight: 500, color: isConfirmed ? 'var(--text)' : 'var(--text-secondary)' }}>
                            {isNaN(new Date(time).getTime()) ? time : format(new Date(time), 'MMM d, yyyy · h:mm a')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={14} /> {count}
                          </span>
                          {isConfirmed && <Check size={16} color="var(--green)" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {m.status === 'Confirmed' && m.meetingLink && (
                  <div style={{ marginTop: 16 }}>
                    <a href={m.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
                      <Video size={16} /> Join Meeting
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
