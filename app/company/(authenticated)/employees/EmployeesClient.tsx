"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, UserX, UserCheck, Edit2, X, Loader2, Shield, Award, UserPlus, FileSignature, CheckCircle } from "lucide-react";

type Employee = {
  id: string; name: string; email: string; designation: string;
  employeeCode: string; employmentType: string; status: string;
  startDate: string; endDate: string | null; teamId: string | null;
  mustResetPassword: boolean; photoUrl: string | null; tier: string;
  team: { id: string; name: string } | null;
  _count: { submissions: number };
};

type Team = { id: string; name: string };

export default function EmployeesClient({ employees, teams }: { employees: Employee[]; teams: Team[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Edit State
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editTeam, setEditTeam] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editTier, setEditTier] = useState("Standard");

  // Direct Hire State
  const [showDirectHire, setShowDirectHire] = useState(false);
  const [dhData, setDhData] = useState({
    name: "", email: "", designation: "", teamId: "", tier: "Standard", employmentType: "Employee", startDate: new Date().toISOString().split('T')[0]
  });

  // Terminate State
  const [terminateEmployee, setTerminateEmployee] = useState<Employee | null>(null);
  const [terminationMessage, setTerminationMessage] = useState("");
  const [terminationFile, setTerminationFile] = useState<string | null>(null);

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
    setEditEmployee(e); setEditTeam(e.teamId || ""); setEditDesignation(e.designation); setEditTier(e.tier || "Standard"); setMsg("");
  };

  const saveEdit = async () => {
    if (!editEmployee) return;
    setLoading(true); setMsg("");
    const res = await fetch(`/api/company/employees/${editEmployee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: editTeam || null, designation: editDesignation, tier: editTier }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setMsg("Saved.");
    startTransition(() => { router.refresh(); setEditEmployee(null); });
  };

  const submitDirectHire = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    const res = await fetch(`/api/company/employees/direct-hire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dhData),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed to create employee."); return; }
    setMsg(`Success! Employee code: ${data.employeeCode}`);
    setTimeout(() => {
      setShowDirectHire(false);
      startTransition(() => router.refresh());
      setDhData({ name: "", email: "", designation: "", teamId: "", tier: "Standard", employmentType: "Employee", startDate: new Date().toISOString().split('T')[0] });
    }, 1500);
  };

  const handleTerminationFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMsg("Termination letter must be a PDF file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setTerminationFile(base64);
      setMsg("");
    };
    reader.readAsDataURL(file);
  };

  const confirmTermination = async () => {
    if (!terminateEmployee) return;
    if (!terminationFile) {
      setMsg("Please attach a termination letter PDF.");
      return;
    }
    setLoading(true); setMsg("");
    await fetch(`/api/company/employees/${terminateEmployee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status: "Terminated", 
        customMessage: terminationMessage,
        terminationFileBase64: terminationFile
      }),
    });
    setLoading(false);
    setTerminateEmployee(null);
    setTerminationMessage("");
    setTerminationFile(null);
    startTransition(() => router.refresh());
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === "Active") {
      const emp = employees.find(e => e.id === id);
      if (emp) {
        setTerminateEmployee(emp);
        setTerminationMessage("");
        setTerminationFile(null);
        setMsg("");
      }
      return;
    }
    
    // Reactivate flow
    if (!confirm("Are you sure you want to reactivate this employee?")) return;
    setLoading(true);
    await fetch(`/api/company/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Active" }),
    });
    setLoading(false);
    startTransition(() => router.refresh());
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm("Are you ABSOLUTELY sure you want to permanently delete this employee? All their activity, messages, and task submissions will be deleted forever. This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/company/employees/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) alert("Failed to delete employee data.");
    startTransition(() => router.refresh());
  };

  const generateReport = async (e: Employee) => {
    setReportGenerating(true);
    setGeneratedReport(null);
    try {
      const res = await fetch(`/api/company/employees/${e.id}/report`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setGeneratedReport(data.report);
      else setGeneratedReport("Failed to generate AI report.");
    } catch {
      setGeneratedReport("Error generating report.");
    }
    setReportGenerating(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Employees & Teams</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{employees.length} total employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowDirectHire(true); setMsg(""); }}>
          <UserPlus size={14} /> Add Employee Directly
        </button>
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
              <th>Tier</th>
              <th>Team</th>
              <th>Type</th>
              <th>Start Date</th>
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
                <td style={{ fontSize: 13 }}>
                  <span className={`badge ${e.tier === "Executive" ? "badge-amber" : e.tier === "Lead" ? "badge-blue" : "badge-gray"}`}>{e.tier || "Standard"}</span>
                </td>
                <td style={{ fontSize: 13 }}>{e.team?.name || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}</td>
                <td>
                  <span className={`badge ${e.employmentType === "Employee" ? "badge-blue" : "badge-purple"}`}>
                    {e.employmentType === "Employee" ? <Shield size={10} /> : <Award size={10} />}
                    {e.employmentType}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{format(new Date(e.startDate), "MMM d, yyyy")}</td>
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
                    {e.status === "Terminated" && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteEmployee(e.id)} disabled={loading}
                        title="Delete Permanently"
                      >
                        <X size={13} />
                      </button>
                    )}
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

      {/* Terminate Employee Modal */}
      {terminateEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--red)" }}>Terminate Employee</h2>
              <button onClick={() => setTerminateEmployee(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                You are about to terminate <strong>{terminateEmployee.name}</strong> ({terminateEmployee.employeeCode}). This will revoke their portal access immediately.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Custom Message (Included in Email)</label>
              <textarea className="input" rows={3} value={terminationMessage} onChange={e => setTerminationMessage(e.target.value)} placeholder="e.g. Effective immediately, your employment has been terminated..." />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label label-required">Termination Letter (PDF)</label>
              <input type="file" accept="application/pdf" className="input" onChange={handleTerminationFileUpload} />
              {terminationFile && <p style={{ fontSize: 13, color: "var(--green)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} /> PDF attached successfully</p>}
            </div>

            {msg && <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 16 }}>{msg}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTerminateEmployee(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={confirmTermination} disabled={loading || !terminationFile}>
                {loading ? <Loader2 size={14} className="spin" /> : "Confirm Termination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Hire Modal */}
      {showDirectHire && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Employee Directly</h2>
              <button onClick={() => setShowDirectHire(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            
            <form onSubmit={submitDirectHire} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Full Name</label>
                  <input required className="input" value={dhData.name} onChange={e => setDhData({...dhData, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input required type="email" className="input" value={dhData.email} onChange={e => setDhData({...dhData, email: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Role / Designation</label>
                  <input required className="input" placeholder="e.g. SOC Analyst" value={dhData.designation} onChange={e => setDhData({...dhData, designation: e.target.value})} />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input required type="date" className="input" value={dhData.startDate} onChange={e => setDhData({...dhData, startDate: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Employment Type</label>
                  <select className="input" value={dhData.employmentType} onChange={e => setDhData({...dhData, employmentType: e.target.value})}>
                    <option value="Employee">Employee</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tier</label>
                  <select className="input" value={dhData.tier} onChange={e => setDhData({...dhData, tier: e.target.value})}>
                    <option value="Standard">Standard</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">Team Assignment</label>
                <select className="input" value={dhData.teamId} onChange={e => setDhData({...dhData, teamId: e.target.value})}>
                  <option value="">Unassigned</option>
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {msg && <div style={{ padding: 12, background: "rgba(147,51,234,0.1)", color: "var(--purple)", borderRadius: 8, fontSize: 13 }}>{msg}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDirectHire(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Tier</label>
                  <select className="input" value={editTier} onChange={e => setEditTier(e.target.value)}>
                    <option value="Standard">Standard</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="label">Team Assignment</label>
                  <select className="input" value={editTeam} onChange={e => setEditTeam(e.target.value)}>
                    <option value="">Unassigned</option>
                    {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
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
