"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatNGN } from "@/lib/format";
import { formatDateTime } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function WalletPage() {
  const { state, fund } = useStore();
  const [tab, setTab] = useState("deposit");
  const [amount, setAmount] = useState(50000);
  const [method, setMethod] = useState("bank");
  const invalid = amount <= 0 || (tab === "withdraw" && amount > state.cash);

  return (
    <>
      <Topbar title="Wallet" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-grid-2">
          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Manage funds</h3><Wallet size={16} className="muted" /></div>
            <p className="iv-sub" style={{ marginBottom: 18, fontSize: 13 }}>
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
            <button className="iv-btn-primary full" disabled={invalid} onClick={() => fund(tab, amount, method)}>
              {tab === "deposit" ? "Deposit " + formatNGN(amount) : "Withdraw " + formatNGN(amount)}
            </button>
          </div>

          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Transaction history</h3></div>
            {state.transactions.length === 0 ? (
              <p className="iv-empty-sm">No transactions yet.</p>
            ) : (
              <div className="iv-tx-list">
                {state.transactions.map((tx) => (
                  <div key={tx.id} className="iv-tx-row">
                    <span className="iv-sub">
                      {tx.type === "deposit" ? "Deposit" : tx.type === "withdraw" ? "Withdrawal" : "Auto-invest \u2192 " + tx.method}
                      <br />{formatDateTime(tx.createdAt)}
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
      </div>
    </>
  );
}
