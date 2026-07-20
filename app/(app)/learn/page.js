"use client";
import { useState } from "react";
import { Send, GraduationCap } from "lucide-react";
import { getTutorReply } from "@/lib/tutor";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function LearnPage() {
  const [messages, setMessages] = useState([
    { role: "tutor", text: "Ask me anything about investing \u2014 P/E ratios, diversification, dividends, ETFs, limit orders, treasury bills, or auto-invest." }
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
      <Topbar title="Learn" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel iv-learn-panel">
          <div className="iv-panel-head"><h3>AI Investment Tutor</h3><GraduationCap size={16} className="muted" /></div>
          <div className="iv-chat-log">
            {messages.map((m, i) => (
              <div key={i} className={"iv-chat-msg " + m.role}>{m.text}</div>
            ))}
          </div>
          <div className="iv-topic-chips">
            {["P/E ratio", "Diversification", "ETFs", "Limit order", "Treasury bill", "Auto-invest"].map((t) => (
              <button key={t} className="iv-chip" onClick={() => send(t)}>{t}</button>
            ))}
          </div>
          <div className="iv-chat-input">
            <input placeholder="Ask about investing..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="iv-btn-primary sm" onClick={() => send()} aria-label="Send"><Send size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
}
