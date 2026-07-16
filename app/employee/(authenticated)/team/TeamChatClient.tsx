"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, MessageSquare, Smile } from "lucide-react";
import { format } from "date-fns";

const EMOJIS = ['😀','😂','🙏','👍','👎','❤️','🔥','✅','⚡','🎉','💯','🤝','😎','🤔','👀','💪','🚀','⚠️','💡','🛡️'];

type Message = {
  id: string;
  message: string;
  createdAt: string;
  employee: { id: string; name: string; photoUrl: string | null };
};

export default function TeamChatClient({ messages, currentUserId }: { messages: Message[], currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!text.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/employee/team/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      setText("");
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
                    {m.message}
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
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 12, position: "relative" }}>
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
          <button type="submit" disabled={loading || !text.trim()} style={{ position: "absolute", right: 6, top: 6, bottom: 6, width: 36, borderRadius: "50%", background: text.trim() ? "var(--purple)" : "rgba(255,255,255,0.1)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} style={{ marginLeft: -2 }} />}
          </button>
        </form>
      </div>
    </div>
  );
}
