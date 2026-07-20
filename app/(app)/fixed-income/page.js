"use client";
import { useState } from "react";
import { Landmark } from "lucide-react";
import { useStore } from "@/lib/store";
import { FIXED_INCOME_PRODUCTS } from "@/lib/stocks";
import { formatNGN, formatDate } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function FixedIncomePage() {
  const { state, investFixedIncome } = useStore();
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(50000);

  function invest(product) {
    const ok = investFixedIncome(product.id, amount);
    if (ok) setSelected(null);
  }

  const now = Date.now();

  return (
    <>
      <Topbar title="Fixed Income" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel">
          <div className="iv-panel-head">
            <div>
              <div className="iv-eyebrow">LOW-RISK</div>
              <h3>Treasury bills & savings</h3>
            </div>
            <Landmark size={16} className="muted" />
          </div>
          <p className="iv-sub" style={{ marginBottom: 18 }}>
            Fixed-rate naira products for cash you don't want exposed to stock market swings \u2014 a category most stock-only apps skip entirely.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {FIXED_INCOME_PRODUCTS.map((p) => (
              <div key={p.id} className="iv-fi-card">
                <h4>{p.name}</h4>
                <div className="iv-fi-rate">{p.rate}%<span className="iv-sub" style={{ fontSize: 12 }}> p.a.</span></div>
                <p className="iv-sub" style={{ margin: "8px 0" }}>
                  {p.flexible ? "Withdraw anytime" : p.tenorDays + "-day tenor"} &middot; Min {formatNGN(p.minAmount)} &middot; {p.risk} risk
                </p>
                {selected === p.id ? (
                  <div>
                    <label className="iv-field">
                      <span>Amount (NGN)</span>
                      <input type="number" min={p.minAmount} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="iv-btn-ghost sm" style={{ flex: 1 }} onClick={() => setSelected(null)}>Cancel</button>
                      <button className="iv-btn-primary sm" style={{ flex: 1 }} onClick={() => invest(p)}>Invest</button>
                    </div>
                  </div>
                ) : (
                  <button className="iv-btn-ghost full" onClick={() => setSelected(p.id)}>Invest</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Your fixed income holdings</h3></div>
          {state.fixedIncomeHoldings.length === 0 ? (
            <p className="iv-empty-sm">No fixed income investments yet.</p>
          ) : (
            <div className="iv-table-wrap"><table className="iv-table">
              <thead><tr><th>Product</th><th>Principal</th><th>Expected payout</th><th>Matures</th><th>Progress</th></tr></thead>
              <tbody>
                {state.fixedIncomeHoldings.map((h) => {
                  const product = FIXED_INCOME_PRODUCTS.find((p) => p.id === h.productId);
                  const total = h.maturityDate - h.startedAt;
                  const elapsed = Math.min(now - h.startedAt, total);
                  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 100;
                  return (
                    <tr key={h.id}>
                      <td>{product ? product.name : "Product"}</td>
                      <td className="mono">{formatNGN(h.amount)}</td>
                      <td className="mono iv-pos-text">{formatNGN(h.payout)}</td>
                      <td className="iv-sub">{formatDate(h.maturityDate)}</td>
                      <td style={{ width: 140 }}>
                        <div className="iv-progress"><div className="iv-progress-fill" style={{ width: pct + "%" }} /></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </>
  );
}
