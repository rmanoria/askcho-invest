"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Send, RotateCcw, Lightbulb } from "lucide-react";
import { getTutorReply } from "@/lib/tutor";
import { useStore } from "@/lib/store";
import { useAuthGate } from "./AuthGate";

const SUGGESTIONS = ["What's moving today?", "Explain P/E ratio", "Diversification tips", "How does the NGX work?"];
const WELCOME = { role: "tutor", text: "Hi, I'm Askcho, your AI assistant. Ask me about a stock, a market term, or what's moving today." };

const BTN_SIZE = 50;
const EDGE_MARGIN = 8;

export default function FloatingChat() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useStore();
  const { requireAuth } = useAuthGate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  // pos is distance from the right/bottom edges of the viewport \u2014 keeping the button
  // bottom-anchored means the chat panel naturally grows upward from wherever it sits.
  const [pos, setPos] = useState({ right: 18, bottom: 88 });
  const logRef = useRef(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, origRight: 0, origBottom: 0 });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, typing]);

  const clamp = useCallback((right, bottom) => {
    const maxRight = Math.max(EDGE_MARGIN, window.innerWidth - BTN_SIZE - EDGE_MARGIN);
    const maxBottom = Math.max(EDGE_MARGIN, window.innerHeight - BTN_SIZE - EDGE_MARGIN);
    return {
      right: Math.min(Math.max(right, EDGE_MARGIN), maxRight),
      bottom: Math.min(Math.max(bottom, EDGE_MARGIN), maxBottom)
    };
  }, []);

  // keep the button on-screen if the viewport is resized/rotated after being dragged
  useEffect(() => {
    function onResize() { setPos((p) => clamp(p.right, p.bottom)); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const onDragMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - d.startX;
    const dy = point.clientY - d.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) d.moved = true;
    if (!d.moved) return;
    if (e.cancelable) e.preventDefault();
    setPos(clamp(d.origRight - dx, d.origBottom - dy));
  }, [clamp]);

  const onDragEnd = useCallback(() => {
    drag.current.active = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);
  }, [onDragMove]);

  // drag tracking lives on `document`, not the button itself \u2014 otherwise a fast
  // mouse/finger movement leaves the button's small hit area and the drag silently stops.
  function onDragStart(e) {
    const point = e.touches ? e.touches[0] : e;
    drag.current = { active: true, moved: false, startX: point.clientX, startY: point.clientY, origRight: pos.right, origBottom: pos.bottom };
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", onDragEnd);
  }

  useEffect(() => () => {
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);
  }, [onDragMove, onDragEnd]);

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

  function onLauncherClick() {
    if (drag.current.moved) { drag.current.moved = false; return; }
    if (!state.user) { requireAuth(); return; }
    setOpen((o) => !o);
  }

  return (
    <div
      className="iv-floating-chat"
      style={{ right: pos.right + "px", bottom: pos.bottom + "px" }}
    >
      {open && (
        <div className="iv-floating-chat-panel">
          <div className="iv-floating-chat-head">
            <img src="/askcho-logo.png" alt="Askcho" className="iv-floating-chat-logo" />
            <div className="iv-floating-chat-head-text">
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
      <button
        className="iv-floating-chat-btn"
        onClick={onLauncherClick}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        aria-label="Open AI chat assistant, draggable"
      >
        {open ? <X size={20} /> : <img src="/askcho-logo.png" alt="Askcho" className="iv-floating-chat-btn-logo" draggable={false} />}
        {!open && <span className="iv-floating-chat-ping" />}
      </button>
    </div>
  );
}