"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Users, Calendar, Loader2, Check, X, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MeetingClient({ initialMeetings, currentUser }: { initialMeetings: unknown[], currentUser: string }) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', proposedTimes: [''] });
  const [loading, setLoading] = useState(false);

  const handleAddTime = () => {
    setForm(prev => ({ ...prev, proposedTimes: [...prev.proposedTimes, ''] }));
  };

  const handleRemoveTime = (index: number) => {
    setForm(prev => ({ ...prev, proposedTimes: prev.proposedTimes.filter((_, i) => i !== index) }));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...form.proposedTimes];
    newTimes[index] = value;
    setForm({ ...form, proposedTimes: newTimes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTimes = form.proposedTimes.filter(t => t.trim() !== '');
    if (!form.title.trim() || validTimes.length === 0) {
      toast.error('Title and at least one proposed time are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/employee/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, proposedTimes: validTimes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // refresh list
      const getRes = await fetch('/api/employee/meetings');
      const getData = await getRes.json();
      if (getRes.ok) {
        setMeetings(getData.meetings);
      } else {
        setMeetings([data.meeting, ...meetings]);
      }
      
      setShowForm(false);
      setForm({ title: '', description: '', proposedTimes: [''] });
      toast.success('Meeting request submitted!');
    } catch (err: any) {
      toast.error((err as any)?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (meetingId: string, timeSlot: string) => {
    try {
      const res = await fetch('/api/employee/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, timeSlot })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMeetings((meetings as any[]).map((m: any) => m.id === meetingId ? data.meeting : m));
      toast.success('Vote recorded');
    } catch (err: any) {
      toast.error((err as any)?.message || 'An error occurred');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'Confirmed') return 'badge-green';
    if (s === 'Completed') return 'badge-blue';
    if (s === 'Cancelled') return 'badge-red';
    return 'badge-amber'; // Voting
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Meeting Requests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Propose and vote on team meetings or 1-on-1s</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Request Meeting
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>New Meeting Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="label label-required">Meeting Title</label>
                <input type="text" className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g., Q3 Planning or 1-on-1" />
              </div>
              
              <div>
                <label className="label">Description (Optional)</label>
                <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Agenda or topics to discuss..." />
              </div>

              <div>
                <label className="label label-required">Proposed Times</label>
                <div style={{ display: 'grid', gap: 12 }}>
                  {form.proposedTimes.map((time, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8 }}>
                      <input type="datetime-local" className="input" value={time} onChange={e => handleTimeChange(index, e.target.value)} required />
                      {form.proposedTimes.length > 1 && (
                        <button type="button" className="btn btn-secondary" onClick={() => handleRemoveTime(index)} style={{ padding: '0 12px' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={handleAddTime} style={{ width: 'fit-content', fontSize: 13, padding: '6px 12px' }}>
                    + Add Time Option
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={14} className="spin" /> Submitting...</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No meeting requests yet. Propose your first meeting above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {meetings.map((m: any) => {
            const proposedTimes = JSON.parse(m.proposedTimes || '[]');
            const votes = JSON.parse(m.votes || '{}');
            const myVote = votes[currentUser];
            
            // Calculate vote counts
            const voteCounts: Record<string, number> = {};
            proposedTimes.forEach((t: string) => voteCounts[t] = 0);
            Object.values(votes).forEach((t: unknown) => {
              if (voteCounts[t as string] !== undefined) (voteCounts as Record<string, number>)[t as string]++;
            });

            return (
              <div key={m.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{m.title}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Proposed by {m.proposer?.name}
                    </div>
                  </div>
                  <span className={`badge ${statusColor(m.status)}`}>{m.status}</span>
                </div>

                {m.description && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {m.description}
                  </p>
                )}

                {m.status === 'Voting' && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Proposed Times (Vote for one)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {proposedTimes.map((time: string, i: number) => {
                        const isMyVote = myVote === time;
                        const count = voteCounts[time] || 0;
                        const date = new Date(time);
                        return (
                          <div 
                            key={i} 
                            onClick={() => handleVote(m.id, time)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleVote(m.id, time);
                              }
                            }}
                            style={{ 
                              padding: '12px 16px', 
                              borderRadius: 8, 
                              border: `1px solid ${isMyVote ? 'var(--purple)' : 'var(--border)'}`,
                              background: isMyVote ? 'rgba(168, 85, 247, 0.05)' : 'var(--bg-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Calendar size={16} color={isMyVote ? 'var(--purple)' : 'var(--text-secondary)'} />
                              <span style={{ fontSize: 14, fontWeight: 500, color: isMyVote ? 'var(--text)' : 'var(--text-secondary)' }}>
                                {isNaN(date.getTime()) ? time : format(date, 'MMM d, yyyy · h:mm a')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                                <Users size={14} /> {count} vote{count !== 1 ? 's' : ''}
                              </div>
                              {isMyVote && <Check size={16} color="var(--purple)" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {m.status === 'Confirmed' && m.confirmedTime && (
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: 16, borderRadius: 8, marginTop: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={16} /> Meeting Confirmed
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--text)' }}>
                      <Calendar size={16} color="var(--text-secondary)" />
                      {format(new Date(m.confirmedTime), 'MMM d, yyyy · h:mm a')}
                    </div>
                    {m.meetingLink && (
                      <div style={{ marginTop: 12 }}>
                        <a href={m.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
                          <Video size={16} /> Join Meeting
                        </a>
                      </div>
                    )}
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
