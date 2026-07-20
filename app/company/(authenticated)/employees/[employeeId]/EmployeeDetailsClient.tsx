"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { 
  FileText, Download, UploadCloud, Loader2, ArrowLeft, Trash2,
  Shield, Award, Briefcase, CheckCircle2,
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

const DOC_TYPES = [
  "Offer Letter", "NDA", "Employment Contract", "Fixed-Term Agreement", "Internship Agreement", 
  "Code of Conduct Acceptance", "Employee Handbook Acknowledgment",
  "Performance Review", "Warning Letter", "Appreciation Letter", "Confirmation Letter", "Contract Extension Letter", "Training Certificate",
  "Internship Completion Certificate", "Recommendation Letter", "Acceptance Letter", "Experience Letter", "No Due Certificate", "Contract Completion Certificate", "Contract End Letter", "Full & Final Settlement",
  "ID Card / CNIC", "Resume / CV", "Other"
];

export default function EmployeeDetailsClient({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(employee.documents);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", type: "Other", base64: "", fileName: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const empType = employee.employmentType || "Employee";
  const isIntern = empType === "Intern";
  const isCompleted = employee.status === "Inactive";

  const getDoc = (title: string) => documents.find(d => d.title === title);
  const getDocUrl = (title: string) => getDoc(title)?.fileUrl || null;
  const getDocStatus = (title: string) => getDoc(title)?.status || "Pending";

  const handleUploadSlot = (title: string, category: string) => {
    setUploadForm({ title, type: category, base64: "", fileName: "" });
    setShowUploadModal(true);
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;
    setDeleting(docId);
    try {
      const res = await fetch(`/api/company/employees/${employee.id}/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Document deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

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
      
      const newDoc = data.document;
      setDocuments(prev => {
        const idx = prev.findIndex(d => d.title === newDoc.title);
        if (idx > -1) {
          const arr = [...prev];
          arr[idx] = newDoc;
          return arr;
        }
        return [newDoc, ...prev];
      });

      setShowUploadModal(false);
      setUploadForm({ title: "", type: "Other", base64: "", fileName: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Document uploaded successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Section 1: Pre-Joining Documents (Only show if they exist in dbDocs)
  const preJoiningDocs = documents.filter(d => 
    ["Job Offer Letter", "Internship Offer Letter", "Contract Offer Letter", "Offer Letter", "Employment Contract", "Internship Agreement", "Fixed-Term Agreement", "Resume / CV", "ID Card / CNIC"].includes(d.title)
  ).map(d => ({
    label: d.title,
    desc: "Generated during application/hiring process",
    icon: "📄",
    status: d.status,
    url: d.fileUrl,
    category: "Joining"
  }));

  // Section 2: Onboarding Consents
  const consentDocsRaw = [
    { label: "NDA", desc: "Non-Disclosure Agreement" },
    { label: "Code of Conduct Acceptance", desc: "Company Code of Conduct" },
    ...(empType === "Employee" || empType === "Full-Time" ? [{ label: "Employee Handbook Acknowledgment", desc: "Company policies acknowledgment" }] : [])
  ];

  const onboardingConsents = consentDocsRaw.map(d => {
    const doc = getDoc(d.label);
    return {
      ...d,
      icon: "📋",
      status: doc?.status || "Pending Consent",
      url: doc?.fileUrl,
      category: "Consent"
    };
  });

  // Section 3: During Tenure
  const duringTenureDocs = [
    { label: "Confirmation Letter", desc: "Official confirmation of employment", icon: "✅", for: ["Employee", "Full-Time"] },
    { label: "Performance Review", desc: "Performance evaluation", icon: "📊", for: ["Intern", "Employee", "Full-Time", "Contract"] },
    { label: "Appreciation Letter", desc: "Recognition and appreciation", icon: "🌟", for: ["Intern", "Employee", "Full-Time", "Contract"] },
    { label: "Contract Extension Letter", desc: "Contract extension approval", icon: "📅", for: ["Contract"] },
    { label: "Warning Letter", desc: "Disciplinary action records", icon: "⚠️", for: ["Intern", "Employee", "Full-Time", "Contract"] },
    { label: "Training Certificate", desc: "Corporate training completion", icon: "🎓", for: ["Employee", "Full-Time"] }
  ].filter(d => d.for.includes(empType)).map(d => ({
    ...d,
    status: getDocUrl(d.label) ? "Available" : getDocStatus(d.label),
    url: getDocUrl(d.label),
    category: "During"
  }));

  // Section 4: Exit & Completion
  const exitDocs = [
    { label: "Internship Completion Certificate", desc: "Official completion certificate", icon: "🎓", for: ["Intern"] },
    { label: "Recommendation Letter", desc: "Letter of recommendation", icon: "👍", for: ["Intern"] },
    { label: "Acceptance Letter", desc: "Resignation Acceptance Letter", icon: "🤝", for: ["Employee", "Full-Time"] },
    { label: "Experience Letter", desc: "Official experience certificate", icon: "📜", for: ["Employee", "Full-Time", "Contract", "Intern"] },
    { label: "No Due Certificate", desc: "Clearance certificate", icon: "💸", for: ["Employee", "Full-Time"] },
    { label: "Contract Completion Certificate", desc: "Project completion certificate", icon: "🎓", for: ["Contract"] },
    { label: "Contract End Letter", desc: "Official end of contract", icon: "🛑", for: ["Contract"] },
    { label: "Full & Final Settlement", desc: "F&F clearance", icon: "💰", for: ["Employee", "Full-Time", "Contract"] },
  ].filter(d => d.for.includes(empType)).map(d => ({
    ...d,
    status: isCompleted ? (getDocUrl(d.label) ? "Available" : getDocStatus(d.label)) : "Locked",
    url: getDocUrl(d.label),
    category: "Exit"
  }));

  const knownTitles = [...preJoiningDocs, ...onboardingConsents, ...duringTenureDocs, ...exitDocs].map(d => d.label);
  const extraDocs = documents.filter(d => !knownTitles.includes(d.title));

  const empTypeBadge =
    isIntern ? { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" }
    : empType === "Contract" ? { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" }
    : { bg: "rgba(168,85,247,0.12)", color: "var(--purple)", border: "rgba(168,85,247,0.3)" };

  const statusBadge =
    employee.status === "Active" ? { bg: "rgba(34,197,94,0.1)", color: "var(--green)", border: "rgba(34,197,94,0.2)" }
    : employee.status === "Inactive" ? { bg: "rgba(239,68,68,0.1)", color: "var(--red)", border: "rgba(239,68,68,0.2)" }
    : { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "rgba(255,255,255,0.1)" };

  const cvLink = employee.cvUrl || employee.applicant?.cvFileUrl;
  const linkedInLink = employee.linkedinUrl || employee.applicant?.linkedIn;

  const AdminDocCard = ({ doc }: { doc: any }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 12, gap: 14, flexWrap: "wrap", transition: "all 0.2s" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, color: "var(--brand-primary)" }}>
          {doc.icon || <FileText size={18} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.label}</span>
            {doc.status === "Available" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>Available</span>}
            {doc.status === "Accepted" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>Accepted</span>}
            {doc.status === "Pending Consent" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Employee Consent Required</span>}
            {doc.status === "Requested" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Requested</span>}
            {doc.status === "Locked" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 3 }}><Lock size={10} /> Locked</span>}
            {doc.status === "Pending" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.1)" }}>Not Uploaded</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{doc.desc}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {doc.url ? (
          <>
            <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" download style={{ gap: 5 }}>
              <Download size={13} /> View
            </a>
            {getDoc(doc.label) && (
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(getDoc(doc.label)!.id, doc.label)} disabled={deleting === getDoc(doc.label)!.id} style={{ padding: "0 10px" }}>
                {deleting === getDoc(doc.label)!.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              </button>
            )}
          </>
        ) : doc.status !== "Locked" && doc.status !== "Pending Consent" ? (
          <button className="btn btn-primary btn-sm" onClick={() => handleUploadSlot(doc.label, doc.category)}>
            <UploadCloud size={13} /> {doc.status === "Requested" ? "Fulfill Request" : "Upload"}
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link href="/company/employees" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Employees
      </Link>

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
        </div>

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
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Document Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => handleUploadSlot("", "Other")}>
          <UploadCloud size={14} /> Upload Custom
        </button>
      </div>

      {preJoiningDocs.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Briefcase size={15} color="var(--brand-primary)" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Pre-Joining Documents</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {preJoiningDocs.map(doc => <AdminDocCard key={doc.label} doc={doc} />)}
          </div>
        </div>
      )}

      {onboardingConsents.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Shield size={15} color="#f97316" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Onboarding Consents</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {onboardingConsents.map(doc => <AdminDocCard key={doc.label} doc={doc} />)}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Clock size={15} color="#3b82f6" />
          <h2 style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>During Tenure</h2>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {duringTenureDocs.map(doc => <AdminDocCard key={doc.label} doc={doc} />)}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Award size={15} color="#22c55e" />
          <h2 style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Completion & Exit Documents</h2>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {exitDocs.map(doc => <AdminDocCard key={doc.label} doc={doc} />)}
        </div>
      </div>

      {extraDocs.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <FileText size={15} color="var(--text-secondary)" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Other Documents</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {extraDocs.map(doc => (
              <AdminDocCard
                key={doc.id}
                doc={{
                  label: doc.title,
                  desc: `Type: ${doc.type}`,
                  icon: <FileText size={18} />,
                  category: doc.type,
                  status: "Available",
                  url: doc.fileUrl,
                }}
              />
            ))}
          </div>
        </div>
      )}

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
                <label className="label">Document Category</label>
                <select className="input" value={uploadForm.type} onChange={e => setUploadForm(f => ({...f, type: e.target.value}))}>
                  <option value="Joining">Pre-Joining</option>
                  <option value="Consent">Consent</option>
                  <option value="During">During Tenure</option>
                  <option value="Exit">Exit / Completion</option>
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
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowUploadModal(false); setUploadForm({ title: "", type: "Other", base64: "", fileName: "" }); }}>Cancel</button>
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
