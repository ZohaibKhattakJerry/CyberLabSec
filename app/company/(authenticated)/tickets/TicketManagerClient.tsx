'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Send,
  Tag,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type TicketEmployee = {
  name: string;
  designation: string;
  employeeCode: string;
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  employee: TicketEmployee;
};

type Props = { initialTickets: Ticket[] };

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;
type TicketStatus = (typeof STATUS_OPTIONS)[number];

const PRIORITY_BADGE: Record<string, string> = {
  Low: 'badge-default',
  Medium: 'badge-amber',
  High: 'badge-red',
  Critical: 'badge-red',
};

const STATUS_BADGE: Record<string, string> = {
  Open: 'badge-amber',
  'In Progress': 'badge-blue',
  Resolved: 'badge-green',
  Closed: 'badge-default',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Open: <AlertCircle size={12} />,
  'In Progress': <Clock size={12} />,
  Resolved: <CheckCircle2 size={12} />,
  Closed: <XCircle size={12} />,
};

const CATEGORY_FILTERS = ['All', 'IT', 'HR', 'Finance', 'Operations', 'Other'] as const;

export default function TicketManagerClient({ initialTickets }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [statusEdits, setStatusEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filtered = tickets.filter((t) => {
    const statusOk =
      statusFilter === 'All' ||
      (statusFilter === 'Open' ? t.status === 'Open' || t.status === 'In Progress' : t.status === statusFilter);
    const catOk = categoryFilter === 'All' || t.category === categoryFilter;
    return statusOk && catOk;
  });

  const handleSubmit = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const newStatus = statusEdits[ticketId] || ticket.status;
    const response = responses[ticketId] || '';

    setLoading((p) => ({ ...p, [ticketId]: true }));
    try {
      const res = await fetch(`/api/company/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, response }),
      });
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: newStatus,
                  response: response || t.response,
                  respondedAt: new Date().toISOString(),
                }
              : t
          )
        );
        setExpandedId(null);
        setResponses((p) => { const n = { ...p }; delete n[ticketId]; return n; });
        setStatusEdits((p) => { const n = { ...p }; delete n[ticketId]; return n; });
      }
    } finally {
      setLoading((p) => ({ ...p, [ticketId]: false }));
    }
  };

  const counts = {
    All: tickets.length,
    Open: tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length,
    Resolved: tickets.filter((t) => t.status === 'Resolved').length,
    Closed: tickets.filter((t) => t.status === 'Closed').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Support Tickets</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Manage and respond to employee support requests
        </p>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Total', value: counts.All, color: 'var(--purple)' },
          { label: 'Active', value: counts.Open, color: 'var(--amber)' },
          { label: 'Resolved', value: counts.Resolved, color: 'var(--green)' },
          { label: 'Closed', value: counts.Closed, color: 'var(--text-muted)' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="card"
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Open', 'Resolved', 'Closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: statusFilter === s ? 'var(--purple)' : 'var(--border)',
                background: statusFilter === s ? 'rgba(168,85,247,0.12)' : 'transparent',
                color: statusFilter === s ? 'var(--purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: statusFilter === s ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: categoryFilter === c ? 'var(--border)' : 'var(--border-subtle)',
                background: categoryFilter === c ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: categoryFilter === c ? 'var(--text)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 80px 100px 120px 80px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <div>Ticket</div>
          <div>Employee</div>
          <div>Category</div>
          <div>Priority</div>
          <div>Status</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div
            style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}
          >
            No tickets found.
          </div>
        ) : (
          filtered.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const currentStatus = statusEdits[ticket.id] || ticket.status;

            return (
              <div key={ticket.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 80px 100px 120px 80px',
                    padding: '14px 24px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ticket.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ticket.employee.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {ticket.employee.employeeCode}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      <Tag size={10} />
                      {ticket.category}
                    </span>
                  </div>
                  <div>
                    <span className={`badge ${PRIORITY_BADGE[ticket.priority] || 'badge-default'}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`badge ${STATUS_BADGE[ticket.status] || 'badge-default'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {STATUS_ICON[ticket.status]}
                      {ticket.status}
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

                {/* Expanded */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 24px 24px',
                      background: 'rgba(255,255,255,0.015)',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 28,
                        paddingTop: 20,
                      }}
                    >
                      {/* Left: description + existing response */}
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
                          Description
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            padding: '12px 14px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {ticket.description}
                        </div>

                        {ticket.response && (
                          <div style={{ marginTop: 16 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                fontWeight: 600,
                                marginBottom: 8,
                              }}
                            >
                              Previous Response
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                lineHeight: 1.7,
                                padding: '12px 14px',
                                background: 'rgba(168,85,247,0.06)',
                                borderRadius: 8,
                                border: '1px solid rgba(168,85,247,0.2)',
                              }}
                            >
                              {ticket.response}
                            </div>
                            {ticket.respondedAt && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                Responded {format(new Date(ticket.respondedAt), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: respond form */}
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
                          Respond & Update
                        </div>

                        {/* Status dropdown */}
                        <div style={{ marginBottom: 12 }}>
                          <label
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
                            Update Status
                          </label>
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              setStatusEdits((p) => ({ ...p, [ticket.id]: e.target.value }))
                            }
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              color: 'var(--text)',
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Response textarea */}
                        <div style={{ marginBottom: 12 }}>
                          <label
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
                            Response Message
                          </label>
                          <textarea
                            placeholder="Write your response to the employee…"
                            value={responses[ticket.id] || ''}
                            onChange={(e) =>
                              setResponses((p) => ({ ...p, [ticket.id]: e.target.value }))
                            }
                            rows={4}
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
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <button
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontSize: 14,
                          }}
                          disabled={loading[ticket.id]}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubmit(ticket.id);
                          }}
                        >
                          <Send size={14} />
                          {loading[ticket.id] ? 'Submitting…' : 'Submit Response'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
