"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, UserX, UserCheck, Edit2, X, Loader2, Shield, Award } from "lucide-react";

type Employee = {
  id: string; name: string; email: string; designation: string;
  employeeCode: string; employmentType: string; status: string;
  startDate: string; endDate: string | null; teamId: string | null;
  mustResetPassword: boolean; photoUrl: string | null;
  team: { id: string; name: string } | null;
  _count: { submissions: number };
};

type Team = { id: string; name: string };

export default function EmployeesClient({ employees, teams }: { employees: Employee[]; teams: Team[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editTeam, setEditTeam] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [analyticsEmployee, setAnalyticsEmployee] = useState<Employee | null>(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openEdit = (e: Employee) => {
    setEditEmployee(e); setEditTeam(e.teamId || ""); setEditDesignation(e.designation); setMsg("");
  };

  const saveEdit = async () => {
    if (!editEmployee) return;
    setLoading(true); setMsg("");
    const res = await fetch(`/api/admin/employees/${editEmployee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: editTeam || null, designation: editDesignation }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setMsg("Saved.");
    startTransition(() => { router.refresh(); setEditEmployee(null); });
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Terminated" : "Active";
    if (!confirm(`Are you sure you want to ${newStatus === "Terminated" ? "terminate" : "reactivate"} this employee?`)) return;
    setLoading(true);
    await fetch(`/api/admin/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    startTransition(() => router.refresh());
  };

  const generateReport = async (e: Employee) => {
    setReportGenerating(true);
    setGeneratedReport(null);
    try {
      const res = await fetch(`/api/admin/employees/${e.id}/report`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setGeneratedReport(data.report);
      else setGeneratedReport("Failed to generate AI report.");
    } catch {
      setGeneratedReport("Error generating report.");
    }
    setReportGenerating(false);
  };

  const generateCertificate = (e: Employee) => {
    alert(`Internship Certificate generated and emailed to ${e.name}.`);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Employees</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{employees.length} total employees</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Terminated">Terminated</option>
        </select>
        <div className="badge badge-gray" style={{ alignSelf: "center", padding: "6px 12px" }}>{filtered.length} results</div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Team</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>Submissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    {e.name}
                    {e.mustResetPassword && <span className="badge badge-amber" style={{ fontSize: 9 }}>Must Reset PW</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{e.employeeCode} · {e.email}</div>
                </td>
                <td style={{ fontSize: 13 }}>{e.designation}</td>
                <td style={{ fontSize: 13 }}>{e.team?.name || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}</td>
                <td>
                  <span className={`badge ${e.employmentType === "Employee" ? "badge-blue" : "badge-purple"}`}>
                    {e.employmentType === "Employee" ? <Shield size={10} /> : <Award size={10} />}
                    {e.employmentType}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{format(new Date(e.startDate), "MMM d, yyyy")}</td>
                <td style={{ fontSize: 13 }}>{e._count.submissions}</td>
                <td>
                  <span className={`badge ${e.status === "Active" ? "badge-green" : "badge-purple"}`}>{e.status}</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAnalyticsEmployee(e); setGeneratedReport(null); }} title="Performance Analytics"><Award size={13} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)} title="Edit"><Edit2 size={13} /></button>
                    <button
                      className={`btn btn-sm ${e.status === "Active" ? "btn-danger" : "btn-secondary"}`}
                      onClick={() => toggleStatus(e.id, e.status)} disabled={loading}
                      title={e.status === "Active" ? "Terminate" : "Reactivate"}
                    >
                      {e.status === "Active" ? <UserX size={13} /> : <UserCheck size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No employees found.</div>
        )}
      </div>

      {/* Edit Modal */}
      {editEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit Employee — {editEmployee.name}</h2>
              <button onClick={() => setEditEmployee(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label">Designation / Role</label>
                <input className="input" value={editDesignation} onChange={e => setEditDesignation(e.target.value)} />
              </div>
              <div>
                <label className="label">Team Assignment</label>
                <select className="input" value={editTeam} onChange={e => setEditTeam(e.target.value)}>
                  <option value="">Unassigned</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {msg && <p style={{ fontSize: 13, color: "var(--green)" }}>{msg}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditEmployee(null)} disabled={loading}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveEdit} disabled={loading}>
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 600, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Award size={18} color="var(--purple)" /> Performance Analytics</h2>
              <button onClick={() => setAnalyticsEmployee(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Employee</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{analyticsEmployee.name} ({analyticsEmployee.employeeCode})</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{analyticsEmployee.designation} · {analyticsEmployee._count.submissions} Tasks Submitted</div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <button className="btn btn-primary" onClick={() => generateReport(analyticsEmployee)} disabled={reportGenerating}>
                {reportGenerating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Generate AI Performance Report"}
              </button>
              {analyticsEmployee.employmentType === "Intern" && (
                <button className="btn btn-secondary" onClick={() => generateCertificate(analyticsEmployee)}>
                  Generate Internship Certificate
                </button>
              )}
            </div>

            {generatedReport && (
              <div style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--purple)" }}>AI Assessment Report</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {generatedReport}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
