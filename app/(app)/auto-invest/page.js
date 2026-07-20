"use client";
import { useState } from "react";
import { Repeat } from "lucide-react";
import { useStore } from "@/lib/store";
import { STOCKS } from "@/lib/stocks";
import { formatNGN, formatDate } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function AutoInvestPage() {
  const { state, addAutoInvest, removeAutoInvest, runAutoInvestNow } = useStore();
  const [ticker, setTicker] = useState(STOCKS[0].ticker);
  const [amount, setAmount] = useState(10000);
  const [frequency, setFrequency] = useState("weekly");

  function submit(e) {
    e.preventDefault();
    if (amount <= 0) return;
    addAutoInvest(ticker, amount, frequency);
    setAmount(10000);
  }

  return (
    <>
      <Topbar title="Auto-Invest" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Create a recurring plan</h3><Repeat size={16} className="muted" /></div>
          <p className="iv-sub" style={{ marginBottom: 18 }}>
            Invest a fixed amount on a schedule (dollar-cost averaging) instead of trying to time the market. Plans support fractional shares.
          </p>
          <form onSubmit={submit}>
            <div className="iv-form-row">
              <label className="iv-field">
                <span>Stock</span>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
                  {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} \u2014 {s.name}</option>)}
                </select>
              </label>
              <label className="iv-field">
                <span>Amount (NGN)</span>
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
              </label>
              <label className="iv-field">
                <span>Frequency</span>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>
            <button type="submit" className="iv-btn-primary">Create plan</button>
          </form>
        </div>

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Your plans</h3></div>
          {state.autoInvests.length === 0 ? (
            <p className="iv-empty-sm">No auto-invest plans yet.</p>
          ) : (
            <div className="iv-table-wrap"><table className="iv-table">
              <thead><tr><th>Stock</th><th>Amount</th><th>Frequency</th><th>Last run</th><th /></tr></thead>
              <tbody>
                {state.autoInvests.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.ticker}</td>
                    <td className="mono">{formatNGN(p.amountNGN)}</td>
                    <td className="iv-sub" style={{ textTransform: "capitalize" }}>{p.frequency}</td>
                    <td className="iv-sub">{p.lastRun ? formatDate(p.lastRun) : "Never"}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="iv-btn-ghost xs" onClick={() => runAutoInvestNow(p.id)}>Run now</button>
                      <button className="iv-btn-danger" onClick={() => removeAutoInvest(p.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </>
  );
}
