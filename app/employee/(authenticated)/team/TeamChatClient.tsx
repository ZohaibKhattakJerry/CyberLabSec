"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await fetch("/api/employee/team/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setLoading(false);
    setText("");
    startTransition(() => router.refresh());
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", height: 600 }}>
      <div style={{ padding: 16, borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Team Chat & Announcements</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column-reverse", gap: 16 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No messages yet. Say hello!</div>
        ) : (
          messages.map((m) => {
            const isMe = m.employee.id === currentUserId;
            return (
              <div key={m.id} style={{ display: "flex", gap: 12, flexDirection: isMe ? "row-reverse" : "row" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {m.employee.name.charAt(0)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{isMe ? "You" : m.employee.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{format(new Date(m.createdAt), "h:mm a")}</span>
                  </div>
                  <div style={{ 
                    padding: "10px 14px", 
                    borderRadius: 12, 
                    background: isMe ? "var(--purple)" : "rgba(255,255,255,0.05)",
                    color: isMe ? "#fff" : "var(--text-secondary)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    borderTopRightRadius: isMe ? 4 : 12,
                    borderTopLeftRadius: isMe ? 12 : 4,
                  }}>
                    {m.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 12 }}>
          <input 
            className="input" 
            style={{ flex: 1 }} 
            placeholder="Type a message..." 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
