"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatNGN } from "@/lib/format";

export default function FundingModal({ onClose }) {
  const { state, fund } = useStore();
  const [tab, setTab] = useState("deposit");
  const [amount, setAmount] = useState(50000);
  const [method, setMethod] = useState("bank");
  const invalid = amount <= 0 || (tab === "withdraw" && amount > state.cash);

  function submit() {
    if (invalid) return;
    const ok = fund(tab, amount, method);
    if (ok) onClose();
  }

  return (
    <div className="iv-modal-overlay" onClick={onClose}>
      <div className="iv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="iv-drawer-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h2>Manage funds</h2>
        <p className="iv-sub" style={{ margin: "6px 0 18px", fontSize: 13 }}>
          Cash available: <span className="mono">{formatNGN(state.cash)}</span>
        </p>
        <div className="iv-trade-tabs">
          <button className={"iv-trade-tab" + (tab === "deposit" ? " active" : "")} onClick={() => setTab("deposit")}>Deposit</button>
          <button className={"iv-trade-tab" + (tab === "withdraw" ? " active" : "")} onClick={() => setTab("withdraw")}>Withdraw</button>
        </div>
        <label className="iv-field">
          <span>Amount (NGN)</span>
          <input type="number" min="0" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <div className="iv-method-row">
          {["bank", "card"].map((m) => (
            <button key={m} className={"iv-method-pill" + (method === m ? " active" : "")} onClick={() => setMethod(m)}>
              {m === "bank" ? "Bank transfer" : "Debit card"}
            </button>
          ))}
        </div>
        <button className="iv-btn-primary full" disabled={invalid} onClick={submit}>
          {tab === "deposit" ? "Deposit " + formatNGN(amount) : "Withdraw " + formatNGN(amount)}
        </button>
        <div className="iv-eyebrow" style={{ marginTop: 24 }}>RECENT TRANSACTIONS</div>
        {state.transactions.length === 0 ? (
          <p className="iv-empty-sm">No transactions yet.</p>
        ) : (
          <div className="iv-tx-list">
            {state.transactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="iv-tx-row">
                <span className="iv-sub">
                  {tx.type === "deposit" ? "Deposit" : tx.type === "withdraw" ? "Withdrawal" : "Auto-invest \u2192 " + tx.method} &middot; {tx.type !== "auto-invest" ? (tx.method === "bank" ? "Bank transfer" : "Card") : ""}
                </span>
                <span className={"mono " + (tx.type === "deposit" ? "iv-pos-text" : "iv-neg-text")}>
                  {tx.type === "deposit" ? "+" : "-"}{formatNGN(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
