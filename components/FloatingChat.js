"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { getTutorReply } from "@/lib/tutor";

const SUGGESTIONS = ["What's moving today?", "Explain P/E ratio", "Diversification tips"];

export default function FloatingChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "tutor", text: "Hi, I'm your AI assistant. Ask me about a stock, a market term, or what's moving today." }
  ]);
  const [input, setInput] = useState("");

  if (pathname === "/ideas") return null;

  function send(text) {
    const q = text || input;
    if (!q.trim()) return;
    const reply = getTutorReply(q);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "tutor", text: reply }]);
    setInput("");
  }

  return (
    <div className="iv-floating-chat">
      {open && (
        <div className="iv-floating-chat-panel">
          <div className="iv-floating-chat-head">
            <span className="iv-floating-chat-avatar"><Bot size={16} /></span>
            <div className="iv-floating-chat-head-text">
              <div className="iv-floating-chat-title">AI Assistant</div>
              <div className="iv-floating-chat-status"><span className="dot" /> Online</div>
            </div>
            <button className="iv-icon-btn" onClick={() => setOpen(false)} aria-label="Close chat"><X size={15} /></button>
          </div>
          <div className="iv-chat-log">
            {messages.map((m, i) => (
              <div key={i} className={"iv-chat-msg " + m.role}>{m.text}</div>
            ))}
          </div>
          {messages.length < 2 && (
            <div className="iv-topic-chips iv-floating-chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="iv-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}
          <div className="iv-chat-input">
            <input placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="iv-btn-primary sm" onClick={() => send()} aria-label="Send"><Send size={14} /></button>
          </div>
        </div>
      )}
      <button className="iv-floating-chat-btn" onClick={() => setOpen((o) => !o)} aria-label="Open AI chat assistant">
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && <span className="iv-floating-chat-ping" />}
      </button>
    </div>
  );
}
