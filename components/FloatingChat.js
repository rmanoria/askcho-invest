"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, Bot, RotateCcw, Lightbulb } from "lucide-react";
import { getTutorReply } from "@/lib/tutor";

const SUGGESTIONS = ["What's moving today?", "Explain P/E ratio", "Diversification tips", "How does the NGX work?"];
const WELCOME = { role: "tutor", text: "Hi, I'm your AI assistant. Ask me about a stock, a market term, or what's moving today." };

export default function FloatingChat() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, typing]);

  if (pathname === "/ideas") return null;

  function send(text) {
    const q = text || input;
    if (!q.trim() || typing) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "tutor", text: getTutorReply(q) }]);
      setTyping(false);
    }, 550);
  }

  function clearChat() { setMessages([WELCOME]); }

  return (
    <div className="iv-floating-chat">
      {open && (
        <div className="iv-floating-chat-panel">
          <div className="iv-floating-chat-head">
            <span className="iv-floating-chat-avatar"><Bot size={17} /></span>
            <div className="iv-floating-chat-head-text">
              <div className="iv-floating-chat-title">AI Assistant</div>
              <div className="iv-floating-chat-status"><span className="dot" /> Online &middot; replies instantly</div>
            </div>
            <button className="iv-icon-btn" onClick={clearChat} aria-label="Clear conversation"><RotateCcw size={14} /></button>
            <button className="iv-icon-btn" onClick={() => setOpen(false)} aria-label="Close chat"><X size={15} /></button>
          </div>

          <div className="iv-chat-log" ref={logRef}>
            {messages.map((m, i) => (
              <div key={i} className={"iv-chat-msg " + m.role}>{m.text}</div>
            ))}
            {typing && (
              <div className="iv-chat-msg tutor iv-chat-typing"><span /><span /><span /></div>
            )}
          </div>

          <div className="iv-topic-chips iv-floating-chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="iv-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          <div className="iv-chat-input">
            <input placeholder="Ask about markets, stocks, or investing..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="iv-btn-primary sm" onClick={() => send()} aria-label="Send"><Send size={14} /></button>
          </div>

          <button className="iv-floating-chat-footer" onClick={() => { setOpen(false); router.push("/ideas"); }}>
            <Lightbulb size={13} /> Open Ideas for AI market summaries &amp; picks
          </button>
        </div>
      )}
      <button className="iv-floating-chat-btn" onClick={() => setOpen((o) => !o)} aria-label="Open AI chat assistant">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span className="iv-floating-chat-ping" />}
      </button>
    </div>
  );
}