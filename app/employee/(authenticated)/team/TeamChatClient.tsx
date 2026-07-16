"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, MessageSquare, Smile, Paperclip, FileText, Download, Image as ImageIcon, FileArchive, X } from "lucide-react";
import { format } from "date-fns";

const EMOJIS = ['😀','😂','🙏','👍','👎','❤️','🔥','✅','⚡','🎉','💯','🤝','😎','🤔','👀','💪','🚀','⚠️','💡','🛡️'];

type Message = {
  id: string;
  message: string;
  createdAt: string;
  employee: { id: string; name: string; photoUrl: string | null };
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
};

export default function TeamChatClient({ messages, currentUserId }: { messages: Message[], currentUserId: string }) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File state
  const [selectedFile, setSelectedFile] = useState<{ file: File; base64: string } | null>(null);
  const [fileError, setFileError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileError("");
    
    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File exceeds 10MB limit");
      return;
    }
    
    // Validate type (docx, pdf, zip, images)
    const validTypes = [
      "application/pdf", 
      "application/zip", "application/x-zip-compressed",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "image/jpeg", "image/png", "image/webp", "image/gif"
    ];
    
    if (!validTypes.includes(file.type)) {
      setFileError("Unsupported file type. Please upload PDF, DOCX, ZIP, or images.");
      return;
    }

    // Read as Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({ file, base64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh());
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;
    setLoading(true);
    setFileError("");
    try {
      const payload: any = { message: text };
      if (selectedFile) {
        payload.fileUrl = selectedFile.base64;
        payload.fileName = selectedFile.file.name;
        payload.fileType = selectedFile.file.type;
        payload.fileSize = selectedFile.file.size;
      }
      
      const res = await fetch("/api/employee/team/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setFileError(err.error || "Failed to send message");
        return;
      }
      
      setText("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowPicker(false);
      startTransition(() => router.refresh());
    } finally {
      setLoading(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", minHeight: 400, overflow: "hidden", border: "1px solid var(--border-subtle)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={16} color="var(--purple)" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Team Secure Channel</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>End-to-end encrypted communication</p>
        </div>
      </div>
      
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column-reverse", gap: 20, background: "rgba(0,0,0,0.1)" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.5 }}>
            <MessageSquare size={48} />
            <p>Channel is open. Say hello to your squad!</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMe = m.employee.id === currentUserId;
            const prevMsg = messages[index + 1];
            const showHeader = !prevMsg || prevMsg.employee.id !== m.employee.id || (new Date(m.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60000);

            return (
              <div key={m.id} style={{ display: "flex", gap: 12, flexDirection: isMe ? "row-reverse" : "row", marginTop: showHeader ? 8 : -10 }}>
                {showHeader ? (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isMe ? "var(--purple)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, color: "#fff" }}>
                    {m.employee.name.charAt(0)}
                  </div>
                ) : <div style={{ width: 36, flexShrink: 0 }} />}
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  {showHeader && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isMe ? "var(--purple)" : "var(--text-primary)" }}>{isMe ? "You" : m.employee.name}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{format(new Date(m.createdAt), "h:mm a")}</span>
                    </div>
                  )}
                  <div style={{ 
                    padding: "10px 16px", 
                    borderRadius: 16, 
                    background: isMe ? "var(--purple)" : "rgba(255,255,255,0.05)",
                    color: isMe ? "#fff" : "var(--text-secondary)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    borderTopRightRadius: isMe && showHeader ? 4 : 16,
                    borderTopLeftRadius: !isMe && showHeader ? 4 : 16,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    border: isMe ? "none" : "1px solid rgba(255,255,255,0.05)"
                  }}>
                    {m.message && <div style={{ marginBottom: m.fileUrl ? 8 : 0 }}>{m.message}</div>}
                    
                    {m.fileUrl && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, background: isMe ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 8, marginTop: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
                          {m.fileType?.includes("image") ? <ImageIcon size={16} /> : m.fileType?.includes("zip") ? <FileArchive size={16} /> : <FileText size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{m.fileName}</div>
                          <div style={{ fontSize: 11, opacity: 0.7 }}>{m.fileSize ? (m.fileSize / 1024 / 1024).toFixed(2) : "0"} MB</div>
                        </div>
                        <a href={m.fileUrl} download={m.fileName} style={{ color: "inherit", padding: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex" }}>
                          <Download size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-card)", position: "relative" }}>
        {showPicker && (
          <div style={{ position: "absolute", bottom: "100%", right: 20, marginBottom: 10, background: "var(--bg-elevated)", padding: 12, borderRadius: 12, border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => addEmoji(e)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", padding: 4, transition: "transform 0.1s" }} className="hover:scale-110">
                {e}
              </button>
            ))}
          </div>
        )}
        
        {fileError && <div style={{ position: "absolute", top: -35, left: 20, right: 20, background: "#ef4444", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, zIndex: 10 }}>{fileError}</div>}
        
        {selectedFile && (
          <div style={{ position: "absolute", top: -60, left: 20, background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 13, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
            <Paperclip size={14} color="var(--purple)" />
            <div style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedFile.file.name}</div>
            <button onClick={() => setSelectedFile(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}><X size={14} /></button>
          </div>
        )}
        
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 12, position: "relative", alignItems: "center" }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept=".pdf,.docx,.zip,.jpg,.jpeg,.png,.webp,.gif" />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: selectedFile ? "var(--purple)" : "var(--text-muted)", cursor: "pointer" }}>
            <Paperclip size={20} />
          </button>
          
          <button type="button" onClick={() => setShowPicker(!showPicker)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <Smile size={20} />
          </button>
          <input 
            className="input" 
            style={{ flex: 1, paddingRight: 50, borderRadius: 24, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }} 
            placeholder="Transmit message..." 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            disabled={loading}
          />
          <button type="submit" disabled={loading || (!text.trim() && !selectedFile)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: (text.trim() || selectedFile) ? "var(--purple)" : "rgba(255,255,255,0.1)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: (text.trim() || selectedFile) ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} style={{ marginLeft: -2 }} />}
          </button>
        </form>
      </div>
    </div>
  );
}
