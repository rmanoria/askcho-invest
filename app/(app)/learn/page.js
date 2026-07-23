"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { getTutorReply } from "@/lib/tutor";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function LearnPage() {
  const [messages, setMessages] = useState([
    { role: "tutor", text: "I'm Askcho AI \u2014 ask me about a stock, a market concept, or what's moving today. Try P/E ratios, diversification, dividends, ETFs, or how the NGX works." }
  ]);
  const [input, setInput] = useState("");

  function send(text) {
    const q = text || input;
    if (!q.trim()) return;
    const reply = getTutorReply(q);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "tutor", text: reply }]);
    setInput("");
  }

  return (
    <>
      <Topbar title="Askcho AI" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel iv-learn-panel">
          <div className="iv-panel-head"><h3>Askcho Investment AI</h3><Sparkles size={16} className="muted" /></div>
          <div className="iv-chat-log">
            {messages.map((m, i) => (
              <div key={i} className={"iv-chat-msg " + m.role}>{m.text}</div>
            ))}
          </div>
          <div className="iv-topic-chips">
            {["P/E ratio", "Diversification", "ETFs", "Dividends", "Volatility", "Market cap", "NGX", "Risk"].map((t) => (
              <button key={t} className="iv-chip" onClick={() => send(t)}>{t}</button>
            ))}
          </div>
          <div className="iv-chat-input">
            <input placeholder="Ask Askcho AI about markets, stocks, or investing..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="iv-btn-primary sm" onClick={() => send()} aria-label="Send"><Send size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
}
