"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileText, Download, UploadCloud, Plus, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type Employee = {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  designation: string;
  employmentType: string;
  documents: {
    id: string;
    title: string;
    type: string;
    fileUrl: string;
    createdAt: string;
  }[];
};

export default function EmployeeDetailsClient({ employee }: { employee: Employee }) {
  const [documents, setDocuments] = useState(employee.documents);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", type: "Contract", base64: "" });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadForm({ ...uploadForm, base64: reader.result as string });
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
        body: JSON.stringify({
          title: uploadForm.title,
          type: uploadForm.type,
          fileUrl: uploadForm.base64
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setDocuments([data.document, ...documents]);
      setShowUploadModal(false);
      setUploadForm({ title: "", type: "Contract", base64: "" });
      toast.success("Document uploaded successfully");
    } catch (err: unknown) {
      toast.error(err.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/company/employees" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 12 }}>
          <ArrowLeft size={14} /> Back to Employees
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{employee.name}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
              {employee.employeeCode} · {employee.designation}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Plus size={14} /> Upload Document
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={18} color="var(--purple)" /> Documents Center
        </h2>
        
        {documents.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
            <FileText size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>No documents found</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Upload an offer letter, NDA, or certificate.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: 8 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)" }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {doc.type} · Uploaded on {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" download>
                  <Download size={14} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <UploadCloud size={20} color="var(--purple)" /> Upload Document
            </h2>
            <form onSubmit={handleUploadSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label label-required">Document Title</label>
                <input className="input" placeholder="e.g. Non-Disclosure Agreement" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} required />
              </div>
              <div>
                <label className="label">Document Type</label>
                <select className="input" value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})}>
                  <option value="Contract">Contract</option>
                  <option value="NDA">NDA</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Policy">Policy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label label-required">File (PDF/Image)</label>
                <input type="file" className="input" accept="application/pdf,image/*" onChange={handleFileUpload} required />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || !uploadForm.base64}>
                  {uploading ? <Loader2 size={14} className="spin" /> : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
