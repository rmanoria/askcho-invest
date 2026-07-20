"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { useStore } from "@/lib/store";
import { STOCKS } from "@/lib/stocks";
import { formatDateTime } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function AlertsPage() {
  const { state, addAlert, removeAlert } = useStore();
  const router = useRouter();
  const [ticker, setTicker] = useState(STOCKS[0].ticker);
  const [condition, setCondition] = useState("above");
  const [price, setPrice] = useState("");

  function submit(e) {
    e.preventDefault();
    const p = Number(price);
    if (!p) return;
    addAlert(ticker, condition, p);
    setPrice("");
  }

  const active = state.alerts.filter((a) => a.active);
  const triggered = state.alerts.filter((a) => !a.active);

  return (
    <>
      <Topbar title="Alerts" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Set a price alert</h3><BellRing size={16} className="muted" /></div>
          <form onSubmit={submit}>
            <div className="iv-form-row">
              <label className="iv-field">
                <span>Stock</span>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
                  {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} \u2014 {s.name}</option>)}
                </select>
              </label>
              <label className="iv-field">
                <span>Condition</span>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="above">Rises above</option>
                  <option value="below">Falls below</option>
                </select>
              </label>
              <label className="iv-field">
                <span>Target price</span>
                <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
              </label>
            </div>
            <button type="submit" className="iv-btn-primary">Create alert</button>
          </form>
        </div>

        <div className="iv-panel">
          <div className="iv-eyebrow">ACTIVE</div>
          {active.length === 0 ? (
            <p className="iv-empty-sm">No active alerts.</p>
          ) : (
            <div className="iv-table-wrap"><table className="iv-table">
              <thead><tr><th>Stock</th><th>Condition</th><th>Target</th><th /></tr></thead>
              <tbody>
                {active.map((a) => (
                  <tr key={a.id}>
                    <td className="mono" style={{ cursor: "pointer" }} onClick={() => router.push("/stock/" + a.ticker)}>{a.ticker}</td>
                    <td className="iv-sub">{a.condition === "above" ? "Rises above" : "Falls below"}</td>
                    <td className="mono">{a.targetPrice.toLocaleString()}</td>
                    <td><button className="iv-btn-ghost xs" onClick={() => removeAlert(a.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          <div className="iv-eyebrow" style={{ marginTop: 18 }}>TRIGGERED</div>
          {triggered.length === 0 ? (
            <p className="iv-empty-sm">No triggered alerts yet.</p>
          ) : (
            <div className="iv-table-wrap"><table className="iv-table">
              <thead><tr><th>Stock</th><th>Condition</th><th>Target</th><th>When</th></tr></thead>
              <tbody>
                {triggered.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.ticker}</td>
                    <td className="iv-sub">{a.condition === "above" ? "Rose above" : "Fell below"}</td>
                    <td className="mono">{a.targetPrice.toLocaleString()}</td>
                    <td className="iv-sub">{a.triggeredAt ? formatDateTime(a.triggeredAt) : "\u2014"}</td>
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
