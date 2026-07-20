"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { 
  FileText, Download, UploadCloud, Plus, Loader2, ArrowLeft, Trash2,
  Shield, Award, Briefcase, FileSignature, CheckCircle2, AlertCircle,
  Clock, User, Mail, Badge, Building2, Lock, Star
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Document = {
  id: string;
  title: string;
  type: string;
  fileUrl: string | null;
  status: string;
  createdAt: string;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  designation: string | null;
  employmentType: string | null;
  status: string | null;
  team?: { name: string } | null;
  documents: Document[];
  cvUrl?: string | null;
  linkedinUrl?: string | null;
  applicant?: { cvFileUrl?: string | null; linkedIn?: string | null } | null;
};

const DOC_TYPES = ["Offer Letter", "NDA", "Employment Contract", "Certificate", "Letter of Recommendation", "Contract Agreement", "Project NDA", "Policy", "Other"];

export default function EmployeeDetailsClient({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(employee.documents);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", type: "Contract", base64: "", fileName: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const empType = employee.employmentType || "Employee";
  const isIntern = empType === "Intern";
  const isCompleted = employee.status === "Inactive";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadForm(f => ({ ...f, fileName: file.name }));
    const reader = new FileReader();
    reader.onload = () => setUploadForm(f => ({ ...f, base64: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.base64 || !uploadForm.title) return toast.error("File and Title required");

    setUploading(true);
    try {
      const res = await fetch(`/api/company/employees/${employee.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: uploadForm.title, type: uploadForm.type, fileUrl: uploadForm.base64 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDocuments([data.document, ...documents]);
      setShowUploadModal(false);
      setUploadForm({ title: "", type: "Contract", base64: "", fileName: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Document uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;
    setDeleting(docId);
    try {
      const res = await fetch(`/api/company/employees/${employee.id}/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

  const empTypeBadge =
    isIntern ? { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" }
    : empType === "Contract" ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" }
    : empType === "Part-Time" ? { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" }
    : { bg: "rgba(168,85,247,0.12)", color: "var(--purple)", border: "rgba(168,85,247,0.3)" };

  const statusBadge =
    employee.status === "Active" ? { bg: "rgba(34,197,94,0.1)", color: "var(--green)", border: "rgba(34,197,94,0.2)" }
    : employee.status === "Inactive" ? { bg: "rgba(239,68,68,0.1)", color: "var(--red)", border: "rgba(239,68,68,0.2)" }
    : { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "rgba(255,255,255,0.1)" };

  const cvLink = employee.cvUrl || employee.applicant?.cvFileUrl;
  const linkedInLink = employee.linkedinUrl || employee.applicant?.linkedIn;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link href="/company/employees" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Employees
      </Link>

      {/* ── EMPLOYEE HEADER CARD ── */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 24, background: "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, transparent 100%)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(109,40,217,0.3))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0, fontSize: 22, fontWeight: 800 }}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{employee.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: empTypeBadge.bg, color: empTypeBadge.color, border: `1px solid ${empTypeBadge.border}`, letterSpacing: "0.04em" }}>{empType}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`, letterSpacing: "0.04em" }}>{employee.status || "Unknown"}</span>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary)" }}>
              {employee.employeeCode && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Badge size={12} /> {employee.employeeCode}</span>}
              {employee.designation && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Star size={12} /> {employee.designation}</span>}
              {employee.email && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={12} /> {employee.email}</span>}
              {employee.team && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Building2 size={12} /> {employee.team.name}</span>}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} style={{ flexShrink: 0 }}>
            <Plus size={14} /> Upload Document
          </button>
        </div>

        {/* Action Bar for CV and LinkedIn */}
        {(cvLink || linkedInLink) && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(168,85,247,0.1)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {cvLink && (
              <a href={cvLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontWeight: 600, gap: 6 }}>
                <FileText size={14} color="var(--purple)" /> View Resume / CV
              </a>
            )}
            {linkedInLink && (
              <a href={linkedInLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontWeight: 600, gap: 6, color: "#3b82f6" }}>
                <User size={14} /> LinkedIn Profile
              </a>
            )}
          </div>
        )}

        {/* Intern completion notice */}
        {isIntern && isCompleted && (
          <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={14} color="var(--green)" />
            <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>Internship Completed — Certificate & LoR available for download</span>
          </div>
        )}
        {isIntern && !isCompleted && (
          <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={14} color="var(--amber)" />
            <span style={{ fontSize: 13, color: "var(--amber)", fontWeight: 600 }}>Internship in progress — Certificate will be available upon completion</span>
          </div>
        )}
      </div>

      {/* ── AUTO-GENERATED DOCUMENTS ── */}
      {isIntern && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Award size={15} color="var(--amber)" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Auto-Generated Certificates</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <AutoDocRow
              icon="🎓"
              title="Internship Completion Certificate"
              desc="Automatically generated official certificate"
              available={isCompleted}
              url={isCompleted ? `/api/company/employees/${employee.id}/certificate?type=completion` : null}
            />
            <AutoDocRow
              icon="📜"
              title="Letter of Recommendation (LoR)"
              desc="Performance-based recommendation letter"
              available={isCompleted}
              url={isCompleted ? `/api/company/employees/${employee.id}/certificate?type=lor` : null}
            />
          </div>
        </div>
      )}

      {/* ── UPLOADED DOCUMENTS ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={15} color="var(--purple)" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Uploaded Documents</h2>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{documents.length} file{documents.length !== 1 ? "s" : ""}</span>
        </div>

        {documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168,85,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <FileText size={22} color="var(--text-muted)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No documents uploaded yet</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Click "Upload Document" to add an offer letter, NDA, or certificate.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 12, gap: 14, flexWrap: "wrap", transition: "all 0.2s" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0 }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", fontSize: 10, fontWeight: 600 }}>{doc.type}</span>
                      {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" download style={{ gap: 5 }}>
                      <Download size={13} /> Download
                    </a>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(doc.id, doc.title)}
                    disabled={deleting === doc.id}
                    style={{ padding: "0 10px" }}
                  >
                    {deleting === doc.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)" }}>
                <UploadCloud size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Upload Document</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>For {employee.name}</p>
              </div>
            </div>
            <form onSubmit={handleUploadSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label label-required">Document Title</label>
                <input className="input" list="doc-titles" placeholder="e.g. Non-Disclosure Agreement" value={uploadForm.title} onChange={e => setUploadForm(f => ({...f, title: e.target.value}))} required />
                <datalist id="doc-titles">
                  {DOC_TYPES.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className="label">Document Type</label>
                <select className="input" value={uploadForm.type} onChange={e => setUploadForm(f => ({...f, type: e.target.value}))}>
                  <option value="Contract">Contract</option>
                  <option value="NDA">NDA</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Letter of Recommendation">Letter of Recommendation</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Policy">Policy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label label-required">File (PDF / Image)</label>
                <div
                  style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: uploadForm.base64 ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)", borderColor: uploadForm.base64 ? "rgba(34,197,94,0.4)" : "var(--border)", transition: "all 0.2s" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadForm.base64 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--green)" }}>
                      <CheckCircle2 size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{uploadForm.fileName}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={24} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Click to select file</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>PDF, PNG, JPG up to 10MB</div>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" style={{ display: "none" }} accept="application/pdf,image/*" onChange={handleFileUpload} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowUploadModal(false); setUploadForm({ title: "", type: "Contract", base64: "", fileName: "" }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || !uploadForm.base64}>
                  {uploading ? <Loader2 size={14} className="spin" /> : <><UploadCloud size={14} /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AutoDocRow({ icon, title, desc, available, url }: { icon: string; title: string; desc: string; available: boolean; url: string | null }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: available ? "rgba(34,197,94,0.03)" : "rgba(245,158,11,0.03)", border: `1px solid ${available ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)"}`, borderRadius: 12, gap: 14, flexWrap: "wrap", opacity: available ? 1 : 0.65 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ fontSize: 20, width: 44, height: 44, borderRadius: 11, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
            {title}
            {available ? <CheckCircle2 size={13} color="var(--green)" /> : <Clock size={12} color="var(--amber)" />}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{desc}</div>
        </div>
      </div>
      {available && url ? (
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 5, borderColor: "rgba(34,197,94,0.3)", color: "var(--green)", flexShrink: 0 }}>
          <Download size={13} /> Download
        </a>
      ) : (
        <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600, flexShrink: 0 }}>Pending Completion</span>
      )}
    </div>
  );
}
