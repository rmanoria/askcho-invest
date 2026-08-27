"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Lightbulb, Star, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { getTutorReply } from "@/lib/tutor";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

function pickReason(s) {
  if (s.changePct >= 2) return "Strong momentum today, up " + s.changePct.toFixed(2) + "% \u2014 worth watching for continuation.";
  if (s.changePct <= -2) return "Pulled back " + Math.abs(s.changePct).toFixed(2) + "% \u2014 could be a buy-the-dip setup if the sector holds up.";
  return "Steady performer in " + s.sector + ", roughly flat today at " + s.changePct.toFixed(2) + "%.";
}

export default function IdeasPage() {
  const { state, getFeaturedLiveStocks, toggleWatch } = useStore();
  const router = useRouter();
  const stocks = getFeaturedLiveStocks();

  const avgChange = stocks.length ? stocks.reduce((a, s) => a + s.changePct, 0) / stocks.length : 0;
  const leader = stocks.length ? [...stocks].sort((a, b) => b.changePct - a.changePct)[0] : null;
  const laggard = stocks.length ? [...stocks].sort((a, b) => a.changePct - b.changePct)[0] : null;

  const sectorMap = {};
  stocks.forEach((s) => { (sectorMap[s.sector] = sectorMap[s.sector] || []).push(s); });
  const sectorStats = Object.entries(sectorMap).map(([sector, list]) => ({
    sector, avg: list.reduce((a, s) => a + s.changePct, 0) / list.length, count: list.length
  }));
  const bestSector = sectorStats.length ? [...sectorStats].sort((a, b) => b.avg - a.avg)[0] : null;
  const worstSector = sectorStats.length ? [...sectorStats].sort((a, b) => a.avg - b.avg)[0] : null;

  const ngxStocks = stocks.filter((s) => s.market === "NGX");
  const globalStocks = stocks.filter((s) => s.market !== "NGX");
  const ngxAvg = ngxStocks.length ? ngxStocks.reduce((a, s) => a + s.changePct, 0) / ngxStocks.length : 0;
  const globalAvg = globalStocks.length ? globalStocks.reduce((a, s) => a + s.changePct, 0) / globalStocks.length : 0;

  const SUMMARIES = [
    {
      tag: "Overview",
      text: (
        <>Markets are broadly {avgChange >= 0 ? "higher" : "lower"} today, averaging {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}% across tracked stocks.
          {leader && <> <span className="mono">{leader.ticker}</span> leads, up {leader.changePct.toFixed(2)}%.</>}
          {laggard && <> <span className="mono">{laggard.ticker}</span> is lagging, down {Math.abs(laggard.changePct).toFixed(2)}%.</>}</>
      )
    },
    {
      tag: "Sector spotlight",
      text: bestSector && worstSector ? (
        <>The {bestSector.sector} sector is leading today, averaging {bestSector.avg >= 0 ? "+" : ""}{bestSector.avg.toFixed(2)}% across {bestSector.count} stock{bestSector.count === 1 ? "" : "s"}.
          {worstSector.sector !== bestSector.sector && <> {worstSector.sector} is the weakest, down {Math.abs(worstSector.avg).toFixed(2)}% on average.</>}</>
      ) : "Not enough sector data to compare yet."
    },
    {
      tag: "NGX vs international",
      text: (
        <>NGX-listed stocks are averaging {ngxAvg >= 0 ? "+" : ""}{ngxAvg.toFixed(2)}% today, {ngxAvg >= globalAvg ? "outperforming" : "trailing"} international names, which are averaging {globalAvg >= 0 ? "+" : ""}{globalAvg.toFixed(2)}%.</>
      )
    }
  ];

  const picks = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5);

  const [messages, setMessages] = useState([
    { role: "tutor", text: "Ask me to explain any of these picks, or about a market concept \u2014 P/E ratios, diversification, dividends, ETFs, or how the NGX works." }
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
      <Topbar title="Ideas" />
      <TickerTape />
      <div className="iv-view">

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>AI market summaries</h3><Lightbulb size={16} className="muted" /></div>
          {stocks.length === 0 ? (
            <p className="iv-empty-sm">Loading live prices\u2026</p>
          ) : (
            <div className="iv-summary-list">
              {SUMMARIES.map((s) => (
                <div key={s.tag} className="iv-summary-item">
                  <div className="iv-eyebrow">{s.tag.toUpperCase()}</div>
                  <p className="iv-sub" style={{ marginBottom: 0 }}>{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Stocks picked by AI</h3><Sparkles size={16} className="muted" /></div>
          <p className="iv-sub" style={{ marginBottom: 12 }}>A daily shortlist based on today's momentum. Not financial advice \u2014 always do your own research.</p>
          <div className="iv-idea-list">
            {picks.map((s) => {
              const watched = state.watchlist.includes(s.ticker);
              return (
                <div key={s.ticker} className="iv-idea-card">
                  <div className="iv-idea-card-top" onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                    <div>
                      <div className="mono">{s.ticker}</div>
                      <div className="iv-sub">{s.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono">{formatMoney(s.price, s.currency)}</div>
                      <div className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>{s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%</div>
                    </div>
                  </div>
                  <p className="iv-idea-reason">{pickReason(s)}</p>
                  <button className="iv-btn-ghost sm" onClick={() => toggleWatch(s.ticker)}>
                    <Star size={14} fill={watched ? "#ffffff" : "none"} /> {watched ? "On watchlist" : "Add to watchlist"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="iv-panel iv-learn-panel">
          <div className="iv-panel-head"><h3>Ask AI</h3></div>
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
            <input placeholder="Ask about markets, stocks, or investing..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="iv-btn-primary sm" onClick={() => send()} aria-label="Send"><Send size={14} /></button>
          </div>
        </div>

      </div>
    </>
  );
}