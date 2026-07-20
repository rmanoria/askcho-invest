"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toNGN } from "@/lib/stocks";
import { formatNGN, formatMoney } from "@/lib/format";

export default function TradePanel({ stock }) {
  const { state, placeOrder } = useStore();
  const [shares, setShares] = useState(1);
  const [side, setSide] = useState("buy");
  const [orderType, setOrderType] = useState("market");
  const [limitPrice, setLimitPrice] = useState(stock.price);
  const [confirming, setConfirming] = useState(false);

  const holding = state.portfolio.find((h) => h.ticker === stock.ticker);
  const effectivePrice = orderType === "limit" ? limitPrice : stock.price;
  const estNGN = toNGN(effectivePrice, stock.currency) * shares;
  const canReview = side === "sell" ? !!(holding && holding.shares >= shares) : true;
  const overBudget = side === "buy" && orderType === "market" && estNGN > state.cash;

  function submit() {
    const ok = placeOrder({ ticker: stock.ticker, side, orderType, shares, limitPrice: orderType === "limit" ? limitPrice : null });
    if (ok) { setConfirming(false); setShares(1); }
  }

  if (!confirming) {
    return (
      <div className="iv-trade-box">
        <div className="iv-trade-tabs">
          <button className={"iv-trade-tab" + (side === "buy" ? " active" : "")} onClick={() => setSide("buy")}>Buy</button>
          <button className={"iv-trade-tab" + (side === "sell" ? " active" : "")} onClick={() => setSide("sell")} disabled={!holding}>Sell</button>
        </div>
        <div className="iv-trade-tabs sub">
          <button className={"iv-order-type-tab" + (orderType === "market" ? " active" : "")} onClick={() => setOrderType("market")}>Market</button>
          <button className={"iv-order-type-tab" + (orderType === "limit" ? " active" : "")} onClick={() => setOrderType("limit")}>Limit</button>
        </div>
        <div className="iv-trade-row">
          <label>Shares</label>
          <div className="iv-stepper">
            <button onClick={() => setShares((v) => Math.max(1, v - 1))} aria-label="Decrease">&minus;</button>
            <input type="number" min={1} value={shares} onChange={(e) => setShares(Math.max(1, Number(e.target.value) || 1))} />
            <button onClick={() => setShares((v) => v + 1)} aria-label="Increase">+</button>
          </div>
        </div>
        {orderType === "limit" && (
          <div className="iv-trade-row">
            <label>Limit price</label>
            <div className="iv-limit-input">
              <span className="mono muted">{stock.currency === "NGN" ? "\u20a6" : "$"}</span>
              <input type="number" step="0.01" min="0" value={limitPrice} onChange={(e) => setLimitPrice(Math.max(0, Number(e.target.value) || 0))} />
            </div>
          </div>
        )}
        <div className="iv-trade-row">
          <span className="iv-sub">Estimated {side === "buy" ? "cost" : "proceeds"}</span>
          <span className="mono">{formatNGN(estNGN)}</span>
        </div>
        <button className="iv-btn-primary full" disabled={!canReview} onClick={() => setConfirming(true)}>
          {canReview ? "Review order" : "Not enough shares"}
        </button>
      </div>
    );
  }

  return (
    <div className="iv-trade-box iv-confirm">
      <div className="iv-confirm-title">Confirm order</div>
      <div className="iv-confirm-row"><span className="iv-sub">Action</span><span className="mono">{side === "buy" ? "Buy" : "Sell"} {stock.ticker}</span></div>
      <div className="iv-confirm-row"><span className="iv-sub">Order type</span><span className="mono">{orderType === "market" ? "Market" : "Limit"}</span></div>
      <div className="iv-confirm-row"><span className="iv-sub">Shares</span><span className="mono">{shares}</span></div>
      {orderType === "limit" && (
        <div className="iv-confirm-row"><span className="iv-sub">Limit price</span><span className="mono">{formatMoney(limitPrice, stock.currency)}</span></div>
      )}
      <div className="iv-confirm-row"><span className="iv-sub">Estimated {side === "buy" ? "cost" : "proceeds"}</span><span className="mono">{formatNGN(estNGN)}</span></div>
      {orderType === "limit" && (
        <p className="iv-sub" style={{ marginTop: 4 }}>This order fills immediately if the market already qualifies, otherwise it stays open in Orders until it does.</p>
      )}
      {overBudget && <p className="iv-sub" style={{ color: "var(--neg)", marginTop: 4 }}>This exceeds your cash balance \u2014 add funds or reduce shares.</p>}
      <div className="iv-confirm-actions">
        <button className="iv-btn-ghost" onClick={() => setConfirming(false)}>Back</button>
        <button className="iv-btn-primary" disabled={overBudget} onClick={submit}>Confirm order</button>
      </div>
    </div>
  );
}
