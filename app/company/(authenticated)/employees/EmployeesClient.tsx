"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Search, UserX, UserCheck, Edit2, X, Loader2, Shield, Award, UserPlus, FileSignature, CheckCircle, UserMinus, Download, Star, Users } from "lucide-react";

type Employee = {
  id: string; name: string; email: string; designation: string;
  employeeCode: string; employmentType: string; status: string;
  startDate: string; endDate: string | null; teamId: string | null;
  mustResetPassword: boolean; photoUrl: string | null; tier: string;
  onboardingCompleted: boolean;
  team: { id: string; name: string } | null;
  _count: { submissions: number };
};

type Team = { id: string; name: string };

export default function EmployeesClient({ employees, teams }: { employees: Employee[]; teams: Team[] }) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTeam, setFilterTeam] = useState("All");
  
  // Edit State
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editTeam, setEditTeam] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editTier, setEditTier] = useState("Standard");

  // Direct Hire State
  const [showDirectHire, setShowDirectHire] = useState(false);
  const [dhData, setDhData] = useState({
    name: "", email: "", designation: "", teamId: "", tier: "Standard", employmentType: "Employee", startDate: new Date().toISOString().split('T')[0], offerLetterBase64: ""
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

  const [offboardEmployee, setOffboardEmployee] = useState<Employee | null>(null);
  const [offboardForm, setOffboardForm] = useState({ reason: "internship_completed", effectiveDate: "", generateCertificate: false, generateLoR: false, customCertificateBase64: "", customLorBase64: "" });
  const [offboardLoading, setOffboardLoading] = useState(false);
  const [offboardSuccessLinks, setOffboardSuccessLinks] = useState<{ cert: string | null, lor: string | null }>({ cert: null, lor: null });

  // Manual Add State
  const [_showManualAdd, setShowManualAdd] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', email: '', designation: '', employmentType: 'Full-Time', teamId: '', startDate: new Date().toISOString().split('T')[0] });
  const [_manualResult, setManualResult] = useState<{ employeeCode: string; tempPassword: string } | null>(null);

  // Badge State
  const [badgeEmployee, setBadgeEmployee] = useState<Employee | null>(null);
  const [badgeType, setBadgeType] = useState("top_contributor");
  const [badgeLabel, setBadgeLabel] = useState("Top Contributor");
  const [badgeLoading, setBadgeLoading] = useState(false);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || e.status === filterStatus;
    const matchTeam = filterTeam === "All" || e.teamId === filterTeam;
    return matchSearch && matchStatus && matchTeam;
  });

  const exportCSV = () => {
    const rows = [
      ["Employee ID", "Name", "Email", "Designation", "Team", "Status", "Employment Type", "Start Date"],
      ...filtered.map(e => [
        e.employeeCode, e.name, e.email, e.designation || "",
        teams.find(t => t.id === e.teamId)?.name || "", e.status, e.tier || "",
        e.startDate ? new Date(e.startDate).toLocaleDateString("en-PK") : "",
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submitManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    const res = await fetch('/api/company/employees/create-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manualForm),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || 'Failed to create employee.'); return; }
    setManualResult({ employeeCode: data.employeeCode, tempPassword: data.tempPassword });
    startTransition(() => router.refresh());
  };

  const submitAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeEmployee) return;
    setBadgeLoading(true); setMsg("");
    const res = await fetch(`/api/company/employees/${badgeEmployee.id}/badges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: badgeType, label: badgeLabel }),
    });
    const data = await res.json();
    setBadgeLoading(false);
    if (!res.ok) { setMsg(data.error || 'Failed to award badge.'); return; }
    setMsg("Badge awarded successfully.");
    setTimeout(() => {
      setBadgeEmployee(null);
      setMsg("");
      startTransition(() => router.refresh());
    }, 1500);
  };

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
      setDhData({ name: "", email: "", designation: "", teamId: "", tier: "Standard", employmentType: "Employee", startDate: new Date().toISOString().split('T')[0], offerLetterBase64: "" });
    }, 1500);
  };

  const handleOfferLetterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMsg("Offer letter must be a PDF file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setDhData({ ...dhData, offerLetterBase64: event.target?.result as string });
      setMsg("");
    };
    reader.readAsDataURL(file);
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

  const handleOffboard = async () => {
    if (!offboardEmployee) return;
    if (!offboardForm.effectiveDate) { setMsg("Please set an effective date."); return; }
    setOffboardLoading(true);
    const res = await fetch(`/api/company/employees/${offboardEmployee.id}/offboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offboardForm),
    });
    const data = await res.json();
    setOffboardLoading(false);
    if (!res.ok) { setMsg(data.error || "Failed to offboard."); return; }
    
    if (offboardForm.generateCertificate || offboardForm.generateLoR) {
      setOffboardSuccessLinks({
        cert: offboardForm.generateCertificate ? `/api/company/employees/${offboardEmployee.id}/certificate?type=completion` : null,
        lor: offboardForm.generateLoR ? `/api/company/employees/${offboardEmployee.id}/certificate?type=lor` : null,
      });
      return;
    }

    setOffboardEmployee(null);
    setOffboardForm({ reason: "internship_completed", effectiveDate: "", generateCertificate: false, generateLoR: false, customCertificateBase64: "", customLorBase64: "" });
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
      <div className="flex-mobile-col" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Employees & Teams</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{employees.length} total employees</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setShowDirectHire(true); setMsg(""); }}>
            <UserPlus size={14} /> Manual Hire
          </button>
        </div>
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
        <select className="input" style={{ width: 160 }} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="All">All Teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="badge badge-gray" style={{ alignSelf: "center", padding: "6px 12px" }}>{filtered.length} results</div>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{ alignSelf: "center", gap: 5 }}>
          <Download size={13} /> Export CSV
        </button>
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
              <th>Onboarding</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e.id}>
                <td data-label="Employee">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    {e.name}
                    {e.mustResetPassword && <span className="badge badge-amber" style={{ fontSize: 9 }}>Must Reset PW</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{e.employeeCode} · {e.email}</div>
                </td>
                <td data-label="Role" style={{ fontSize: 13 }}>{e.designation}</td>
                <td data-label="Tier" style={{ fontSize: 13 }}>
                  <span className={`badge ${e.tier === "Executive" ? "badge-amber" : e.tier === "Lead" ? "badge-blue" : "badge-gray"}`}>{e.tier || "Standard"}</span>
                </td>
                <td data-label="Team" style={{ fontSize: 13 }}>{e.team?.name || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}</td>
                <td data-label="Type">
                  <span className={`badge ${e.employmentType === "Employee" ? "badge-blue" : "badge-purple"}`}>
                    {e.employmentType === "Employee" ? <Shield size={10} /> : <Award size={10} />}
                    {e.employmentType}
                  </span>
                </td>
                <td data-label="Onboarding" style={{ fontSize: 13 }}>
                  {e.onboardingCompleted ? <span style={{ color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={12} /> Done</span> : <span style={{ color: "var(--amber)" }}>Pending</span>}
                </td>
                <td data-label="Start Date" style={{ fontSize: 12, color: "var(--text-muted)" }}>{format(new Date(e.startDate), "MMM d, yyyy")}</td>
                <td data-label="Status">
                  <span className={`badge ${e.status === "Active" ? "badge-green" : e.status === "Inactive" ? "badge-gray" : "badge-red"}`}>{e.status}</span>
                </td>
                <td data-label="Actions">
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setBadgeEmployee(e); setMsg(""); }} title="Award Badge"><Star size={13} color="var(--amber)" /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAnalyticsEmployee(e); setGeneratedReport(null); }} title="Performance Analytics"><Award size={13} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)} title="Edit"><Edit2 size={13} /></button>
                    <Link href={`/company/employees/${e.id}`} className="btn btn-ghost btn-sm" title="View Profile & Documents"><FileSignature size={13} /></Link>
                    {e.status === "Active" && (
                      <>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => toggleStatus(e.id, e.status)}
                          title="Terminate Employee"
                        >
                          <UserX size={13} />
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setOffboardEmployee(e); setOffboardForm({ reason: "internship_completed", effectiveDate: "", generateCertificate: false, generateLoR: false, customCertificateBase64: "", customLorBase64: "" }); setMsg(""); setOffboardSuccessLinks({cert: null, lor: null}); }}
                          title="Offboard Employee"
                        >
                          <UserMinus size={13} />
                        </button>
                      </>
                    )}
                    {(e.status === "Terminated" || e.status === "Inactive") && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => toggleStatus(e.id, e.status)} disabled={loading} title="Reactivate"><UserCheck size={13} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteEmployee(e.id)} disabled={loading} title="Delete"><X size={13} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon-wrapper">
              <Search size={28} />
            </div>
            <div className="empty-state-title">No employees found</div>
            <div className="empty-state-description">We couldn't find any employees matching your current search or filter criteria.</div>
          </div>
        )}
      </div>

      {/* Terminate Employee Modal */}
      {terminateEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: 32 }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
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
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Manual Hire</h2>
              <button onClick={() => setShowDirectHire(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            
            <form onSubmit={submitDirectHire} style={{ display: "grid", gap: 16 }}>
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Full Name</label>
                  <input required className="input" value={dhData.name} onChange={e => setDhData({...dhData, name: e.target.value})} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input required type="email" className="input" value={dhData.email} onChange={e => setDhData({...dhData, email: e.target.value})} />
                </div>
              </div>
              
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Role / Designation</label>
                  <input required className="input" placeholder="e.g. SOC Analyst" value={dhData.designation} onChange={e => setDhData({...dhData, designation: e.target.value})} />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input required type="date" className="input" value={dhData.startDate} onChange={e => setDhData({...dhData, startDate: e.target.value})} />
                </div>
              </div>
              
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

              <div>
                <label className="label">Offer Letter (PDF, Optional)</label>
                <input type="file" accept="application/pdf" className="input" onChange={handleOfferLetterUpload} />
                {dhData.offerLetterBase64 && <p style={{ fontSize: 13, color: "var(--green)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} /> Offer Letter attached</p>}
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
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit Employee — {editEmployee.name}</h2>
              <button onClick={() => setEditEmployee(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label">Designation / Role</label>
                <input className="input" value={editDesignation} onChange={e => setEditDesignation(e.target.value)} />
              </div>
              <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
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
                <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "var(--purple)" }}>AI Assessment Report</h3>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow && generatedReport) {
                        const sanitized = generatedReport.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Performance Report - ${analyticsEmployee.name}</title>
                              <style>
                                body { font-family: sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                                h1 { color: #581c87; margin-bottom: 4px; }
                                p.subtitle { color: #555; margin-bottom: 40px; }
                                pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; background: #f9fafb; padding: 20px; border-left: 4px solid #9333ea; }
                              </style>
                            </head>
                            <body>
                              <h1>CyberLabSec AI Performance Analytics</h1>
                              <p class="subtitle">Employee: ${analyticsEmployee.name} (${analyticsEmployee.employeeCode})<br/>Date: ${new Date().toLocaleDateString()}</p>
                              <pre>${sanitized}</pre>
                              <script>window.print(); window.onafterprint = () => window.close();</script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                  >
                    Print / Download PDF
                  </button>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                  {generatedReport}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offboarding Modal */}
      {offboardEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 520, width: "100%", padding: 32 }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <UserMinus size={18} color="var(--red)" /> Offboard Employee
              </h2>
              <button onClick={() => setOffboardEmployee(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>

            <div style={{ padding: "12px 16px", background: "rgba(168,85,247,0.06)", borderRadius: 8, border: "1px solid rgba(168,85,247,0.15)", marginBottom: 20, fontSize: 13, color: "var(--text-secondary)" }}>
              Offboarding <strong style={{ color: "var(--text-primary)" }}>{offboardEmployee.name}</strong> ({offboardEmployee.employeeCode})
            </div>

            {offboardSuccessLinks.cert || offboardSuccessLinks.lor ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <CheckCircle size={48} color="var(--green)" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Employee Offboarded Successfully</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>The requested documents are ready.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
                  {offboardSuccessLinks.cert && (
                    <a href={offboardSuccessLinks.cert} target="_blank" rel="noreferrer" className="btn btn-primary" onClick={() => setOffboardSuccessLinks(l => ({...l, cert: null}))}>
                      <Download size={14} /> Download Certificate
                    </a>
                  )}
                  {offboardSuccessLinks.lor && (
                    <a href={offboardSuccessLinks.lor} target="_blank" rel="noreferrer" className="btn btn-primary" onClick={() => setOffboardSuccessLinks(l => ({...l, lor: null}))}>
                      <Download size={14} /> Download LoR
                    </a>
                  )}
                </div>
                {(!offboardSuccessLinks.cert && !offboardSuccessLinks.lor) && (
                  <button className="btn btn-secondary" onClick={() => { setOffboardEmployee(null); setOffboardSuccessLinks({cert: null, lor: null}); startTransition(() => router.refresh()); }}>Close</button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                <label className="label label-required">Offboarding Reason</label>
                <select className="input" value={offboardForm.reason} onChange={(e) => setOffboardForm((f) => ({ ...f, reason: e.target.value }))}>
                  <option value="internship_completed">Internship Completed</option>
                  <option value="resignation">Resignation</option>
                  <option value="termination">Termination</option>
                  <option value="contract_ended">Contract Ended</option>
                </select>
              </div>
              <div>
                <label className="label label-required">Effective Date</label>
                <input type="datetime-local" className="input" value={offboardForm.effectiveDate} onChange={(e) => setOffboardForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
              </div>
            </div>

            {offboardForm.effectiveDate && new Date(offboardForm.effectiveDate) <= new Date() && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
                ⚠️ Portal access will be revoked <strong>immediately</strong> on submit.
              </div>
            )}

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={offboardForm.generateCertificate} onChange={(e) => setOffboardForm((f) => ({ ...f, generateCertificate: e.target.checked, customCertificateBase64: "" }))} style={{ width: 16, height: 16, accentColor: "var(--purple)" }} />
                Auto-Generate Internship Completion Certificate
              </label>
              {!offboardForm.generateCertificate && (
                <div style={{ paddingLeft: 26, marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Or Attach Custom Certificate (PDF/Image)</label>
                  <input type="file" className="input" accept="application/pdf,image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setOffboardForm(f => ({ ...f, customCertificateBase64: reader.result as string }));
                    reader.readAsDataURL(file);
                  }} style={{ padding: "8px", fontSize: 12 }} />
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={offboardForm.generateLoR} onChange={(e) => setOffboardForm((f) => ({ ...f, generateLoR: e.target.checked, customLorBase64: "" }))} style={{ width: 16, height: 16, accentColor: "var(--purple)" }} />
                Auto-Generate Letter of Recommendation (LoR)
              </label>
              {!offboardForm.generateLoR && (
                <div style={{ paddingLeft: 26 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Or Attach Custom LoR (PDF/Image)</label>
                  <input type="file" className="input" accept="application/pdf,image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setOffboardForm(f => ({ ...f, customLorBase64: reader.result as string }));
                    reader.readAsDataURL(file);
                  }} style={{ padding: "8px", fontSize: 12 }} />
                </div>
              )}
            </div>

            {msg && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>{msg}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOffboardEmployee(null)}>Cancel</button>
                <button className="btn btn-danger" style={{ flex: 1, gap: 8 }} onClick={handleOffboard} disabled={offboardLoading}>
                  {offboardLoading ? <Loader2 size={14} className="spin" /> : <UserMinus size={14} />} Offboard Employee
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Award Badge Modal */}
      {badgeEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", padding: 32 }}>
            <div className="flex-mobile-col" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={18} color="var(--amber)" /> Award Badge to {badgeEmployee.name}
              </h2>
              <button onClick={() => setBadgeEmployee(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            
            <form onSubmit={submitAwardBadge} style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label">Badge Type</label>
                <select className="input" value={badgeType} onChange={e => {
                  setBadgeType(e.target.value);
                  const labels: Record<string, string> = {
                    "top_contributor": "Top Contributor",
                    "bug_hunter": "Bug Hunter",
                    "mvp": "MVP",
                    "security_champion": "Security Champion",
                    "innovator": "Innovator"
                  };
                  setBadgeLabel(labels[e.target.value] || e.target.value);
                }}>
                  <option value="top_contributor">Top Contributor</option>
                  <option value="bug_hunter">Bug Hunter</option>
                  <option value="mvp">MVP</option>
                  <option value="security_champion">Security Champion</option>
                  <option value="innovator">Innovator</option>
                </select>
              </div>
              <div>
                <label className="label">Badge Label (Customizable)</label>
                <input required className="input" value={badgeLabel} onChange={e => setBadgeLabel(e.target.value)} />
              </div>

              {msg && <div style={{ fontSize: 13, padding: "12px 16px", borderRadius: 8, background: msg.includes("success") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${msg.includes("success") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: msg.includes("success") ? "var(--green)" : "var(--red)" }}>
                {msg}
              </div>}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setBadgeEmployee(null)} disabled={badgeLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: "var(--amber)", borderColor: "var(--amber)", color: "#000" }} disabled={badgeLoading}>
                  {badgeLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Award Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
