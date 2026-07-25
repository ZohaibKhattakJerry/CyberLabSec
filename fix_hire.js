const fs = require('fs');

const file = 'app/company/(authenticated)/applications/ApplicationsClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add hireForm state
if (!content.includes('const [hireForm, setHireForm]')) {
  content = content.replace(
    'const [actionTarget, setActionTarget] = useState<"bulk" | "single" | null>(null);',
    'const [actionTarget, setActionTarget] = useState<"bulk" | "single" | null>(null);\n  const [hireForm, setHireForm] = useState({ offerLetterBase64: "", customMessage: "", startingSalary: "", expectedJoinDate: "", durationMonths: "", employmentType: "Intern" });'
  );
}

// 2. Add handleOfferUpload
if (!content.includes('const handleOfferUpload')) {
  content = content.replace(
    '  const copyEmail =',
    '  const handleOfferUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("File size must be < 5MB"); return; } const reader = new FileReader(); reader.onload = () => setHireForm(prev => ({ ...prev, offerLetterBase64: reader.result as string })); reader.readAsDataURL(file); };\n  const copyEmail ='
  );
}

// 3. Replace confirmBulkHire with submitHire
content = content.replace(
  /const confirmBulkHire = async \(\) => \{[\s\S]*?confetti\(\{ particleCount: 200, spread: 90, origin: \{ y: 0.5 \}, zIndex: 9999 \}\);[\s\S]*?router\.refresh\(\); \} \}\);[\s\S]*?setNotesSaved\(true\);[\s\S]*?\};/g, 
  '// REPLACED BY SUBMITHIRE'
);

content = content.replace(
  /const confirmBulkHire = async \(\) => \{[\s\S]*?router\.refresh\(\);[\s\S]*?\}\s*\};\n/,
  ''
);

// wait let's just find `const confirmBulkHire = async () => {` and replace it
const startConfirmBulkHire = content.indexOf('const confirmBulkHire = async () => {');
if (startConfirmBulkHire !== -1) {
    let braceCount = 0;
    let endConfirmBulkHire = -1;
    for (let i = startConfirmBulkHire; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endConfirmBulkHire = i;
                break;
            }
        }
    }
    
    const submitHireCode = `
  const submitHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.offerLetterBase64) { toast.error("Please upload the offer letter."); return; }
    
    setActionLoading(true);
    try {
      const targetIds = actionTarget === "bulk" ? selectedIds : (selected ? [selected.id] : []);
      for (const id of targetIds) {
        const res = await fetch(\`/api/company/applications/\${id}/hire\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hireForm)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to hire candidate");
        }
      }
      toast.success("Successfully hired candidate(s)!");
      setShowBulkHireModal(false);
      closeModal();
      router.refresh();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
    } catch (err: any) {
      toast.error(err.message || "Failed to hire candidate(s).");
    } finally {
      setActionLoading(false);
    }
  };`;
    content = content.substring(0, startConfirmBulkHire) + submitHireCode + content.substring(endConfirmBulkHire + 1);
}


// 4. Replace the showBulkHireModal JSX
const hireModalJSXStart = content.indexOf('{/* ====== BULK APPROVE & HIRE CONFIRMATION MODAL ====== */}');
const hireModalJSXEnd = content.indexOf('{/* ====== CANDIDATE DETAIL MODAL ====== */}');

// The file might end after the modal or have something else.
let replaceEnd = content.indexOf('    </div>\n\n  );\n}');
if (replaceEnd === -1) replaceEnd = content.lastIndexOf('</div>');

if (hireModalJSXStart !== -1) {
    const newModal = `
      {/* ====== HIRE & OFFER MODAL ====== */}
      {showBulkHireModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ position: "relative", maxWidth: 500, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <button onClick={() => setShowBulkHireModal(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", zIndex: 10 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <X size={18} />
            </button>
            <div style={{ padding: 24, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, paddingRight: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <UserCheck size={18} color="var(--green)" /> 
                {actionTarget === "bulk" ? \`Approve & Hire \${selectedIds.length} Candidate(s)\` : "Approve & Hire Candidate"}
              </h2>
            </div>
            
            <form onSubmit={submitHire} style={{ overflowY: "auto", padding: 24, display: "grid", gap: 16 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                This will officially hire the candidate(s), generate employee credentials, and send them an Offer Letter via email.
              </p>
              
              <div>
                <label className="label label-required">Offer Letter (PDF)</label>
                <input type="file" accept="application/pdf" className="input" onChange={handleOfferUpload} required style={{ padding: "8px 12px" }} />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>This PDF will be sent to the candidate.</p>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Employment Type</label>
                  <select className="input" value={hireForm.employmentType} onChange={e => setHireForm({...hireForm, employmentType: e.target.value})}>
                    <option value="Intern">Intern</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>
                <div>
                  <label className="label">Starting Salary</label>
                  <input type="text" className="input" placeholder="e.g. $5,000 / month" value={hireForm.startingSalary} onChange={e => setHireForm({...hireForm, startingSalary: e.target.value})} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="label">Expected Start Date</label>
                  <input type="date" className="input" value={hireForm.expectedJoinDate} onChange={e => setHireForm({...hireForm, expectedJoinDate: e.target.value})} />
                </div>
                <div>
                  <label className="label">Duration (Months)</label>
                  <input type="number" min="1" max="60" className="input" placeholder="e.g. 6" value={hireForm.durationMonths} onChange={e => setHireForm({...hireForm, durationMonths: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Custom Welcome Message (Optional)</label>
                <textarea className="input" rows={3} placeholder="Add a personal note to the offer email..." value={hireForm.customMessage} onChange={e => setHireForm({...hireForm, customMessage: e.target.value})} />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBulkHireModal(false)} disabled={actionLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading || !hireForm.offerLetterBase64}>
                  {actionLoading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />} Confirm & Hire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
    // Also we need to replace the `confirmBulkHire` onclicks to just open the modal. Wait, `showBulkHireModal` already opens the modal, and the form onSubmit calls `submitHire`.
    content = content.substring(0, hireModalJSXStart) + newModal;
}

fs.writeFileSync(file, content);
