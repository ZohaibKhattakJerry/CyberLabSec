'use client';

import { useState } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  _Clock,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  User,
  MessageSquare,
} from 'lucide-react';

type LeaveEmployee = {
  name: string;
  designation: string;
  employeeCode: string;
  team?: { name: string } | null;
};

type Leave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewerNote?: string | null;
  createdAt: string;
  employee: LeaveEmployee;
};

type Props = { initialLeaves: Leave[], hideHeader?: boolean };

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;

const statusStyle: Record<string, string> = {
  Pending: 'badge-amber',
  Approved: 'badge-green',
  Rejected: 'badge-red',
};

function getDays(start: string, end: string) {
  return differenceInCalendarDays(new Date(end), new Date(start)) + 1;
}

export default function CompanyLeaveClient({ initialLeaves, hideHeader }: Props) {
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves);
  const [filter, setFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filtered =
    filter === 'All' ? leaves : leaves.filter((l) => l.status === filter);

  const handleAction = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    setLoading((p) => ({ ...p, [leaveId]: true }));
    try {
      const res = await fetch(`/api/company/leave/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewerNote: notes[leaveId] || '' }),
      });
      if (res.ok) {
        setLeaves((prev) =>
          prev.map((l) =>
            l.id === leaveId
              ? { ...l, status, reviewerNote: notes[leaveId] || null }
              : l
          )
        );
        setExpandedId(null);
      }
    } finally {
      setLoading((p) => ({ ...p, [leaveId]: false }));
    }
  };

  const counts = {
    All: leaves.length,
    Pending: leaves.filter((l) => l.status === 'Pending').length,
    Approved: leaves.filter((l) => l.status === 'Approved').length,
    Rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Leave Requests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Review and manage employee leave applications
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: filter === s ? 'rgba(168,85,247,0.12)' : 'var(--card-bg)',
              border: filter === s ? '1px solid var(--purple)' : '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color:
                  s === 'Pending'
                    ? 'var(--amber)'
                    : s === 'Approved'
                    ? 'var(--green)'
                    : s === 'Rejected'
                    ? 'var(--red)'
                    : 'var(--purple)',
              }}
            >
              {counts[s]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No {filter !== 'All' ? filter.toLowerCase() : ''} leave requests found.
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1.5fr 80px 100px 100px',
                padding: '12px 24px',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <div>Employee</div>
              <div>Type</div>
              <div>Dates</div>
              <div>Days</div>
              <div>Status</div>
              <div />
            </div>

            {filtered.map((leave) => {
              const isExpanded = expandedId === leave.id;
              const isPending = leave.status === 'Pending';
              const days = getDays(leave.startDate, leave.endDate);

              return (
                <div key={leave.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {/* Main row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1.5fr 80px 100px 100px',
                      padding: '14px 24px',
                      alignItems: 'center',
                      transition: 'background 0.1s',
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{leave.employee.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {leave.employee.designation}
                        {leave.employee.team && ` · ${leave.employee.team.name}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{leave.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {format(new Date(leave.startDate), 'MMM d')} –{' '}
                      {format(new Date(leave.endDate), 'MMM d, yyyy')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>
                      {days}d
                    </div>
                    <div>
                      <span className={`badge ${statusStyle[leave.status] || 'badge-default'}`}>
                        {leave.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {isExpanded ? (
                        <ChevronUp size={16} color="var(--text-muted)" />
                      ) : (
                        <ChevronDown size={16} color="var(--text-muted)" />
                      )}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 24px 20px',
                        background: 'rgba(255,255,255,0.015)',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 24,
                          paddingTop: 16,
                        }}
                      >
                        {/* Details */}
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              fontWeight: 600,
                              marginBottom: 10,
                            }}
                          >
                            Request Details
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <User size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {leave.employee.name} ({leave.employee.employeeCode})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <CalendarDays size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {format(new Date(leave.startDate), 'MMMM d')} to{' '}
                                {format(new Date(leave.endDate), 'MMMM d, yyyy')} ({days} day{days !== 1 ? 's' : ''})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <MessageSquare size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {leave.reason}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              Submitted {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                            </div>
                          </div>

                          {leave.reviewerNote && (
                            <div
                              style={{
                                marginTop: 12,
                                padding: '10px 14px',
                                background: 'rgba(168,85,247,0.06)',
                                borderRadius: 8,
                                border: '1px solid rgba(168,85,247,0.2)',
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--purple)' }}>
                                Reviewer note:{' '}
                              </span>
                              {leave.reviewerNote}
                            </div>
                          )}
                        </div>

                        {/* Action panel — only for pending */}
                        {isPending && (
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                fontWeight: 600,
                                marginBottom: 10,
                              }}
                            >
                              Review
                            </div>
                            <textarea
                              placeholder="Optional note to employee…"
                              value={notes[leave.id] || ''}
                              onChange={(e) =>
                                setNotes((p) => ({ ...p, [leave.id]: e.target.value }))
                              }
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                color: 'var(--text)',
                                fontSize: 13,
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                marginBottom: 12,
                                boxSizing: 'border-box',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button
                                className="btn btn-primary"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  background:
                                    'linear-gradient(135deg, #22c55e, #16a34a)',
                                  border: 'none',
                                  fontSize: 13,
                                }}
                                disabled={loading[leave.id]}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(leave.id, 'Approved');
                                }}
                              >
                                <CheckCircle size={14} />
                                {loading[leave.id] ? 'Processing…' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  border: '1px solid var(--red)',
                                  color: 'var(--red)',
                                  fontSize: 13,
                                }}
                                disabled={loading[leave.id]}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(leave.id, 'Rejected');
                                }}
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
