"use client";
import { useState, useEffect } from "react";
import { X, Star, BellRing } from "lucide-react";
import { formatMoney } from "@/lib/format";
import Select from "./Select";

export default function WatchAlertModal({ open, stock, stocks, onChangeStock, onClose, watched, onToggleWatch, onCreateAlert }) {
  const [setAlert, setSetAlert] = useState(false);
  const [condition, setCondition] = useState("above");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (open) { setSetAlert(false); setCondition("above"); setPrice(""); }
  }, [open, stock]);

  if (!open || !stock) return null;

  function submit(e) {
    e.preventDefault();
    if (!watched) onToggleWatch(stock.ticker);
    if (setAlert && Number(price)) onCreateAlert(stock.ticker, condition, Number(price));
    onClose();
  }

  return (
    <div className="iv-modal-overlay" onClick={onClose}>
      <div className="iv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="iv-icon-btn" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, zIndex: 1 }}><X size={16} /></button>
        <div className="iv-panel-head" style={{ marginBottom: 18, paddingRight: 44, flexWrap: "nowrap" }}>
          <h3>Watch &amp; alert</h3>
          <Star size={16} className="muted" style={{ flexShrink: 0 }} />
        </div>

        <form onSubmit={submit}>
          <label className="iv-field">
            <span>Stock</span>
            <Select
              value={stock.ticker}
              onChange={onChangeStock}
              options={stocks.map((s) => ({ value: s.ticker, label: s.ticker + " \u2014 " + s.name }))}
            />
          </label>

          <div className="iv-summary-watch-item" style={{ width: "100%", justifyContent: "space-between", margin: "12px 0 20px" }}>
            <div>
              <div className="mono">{stock.ticker}</div>
              <div className="iv-sub">{formatMoney(stock.price, stock.currency)}</div>
            </div>
            <div className={"iv-chg " + (stock.changePct >= 0 ? "pos" : "neg")}>{stock.changePct >= 0 ? "+" : ""}{stock.changePct.toFixed(2)}%</div>
          </div>

          {watched && <p className="iv-sub" style={{ marginBottom: 14 }}>Already on your watchlist.</p>}

          <button type="button" className="iv-btn-ghost sm" onClick={() => setSetAlert((v) => !v)}>
            <BellRing size={14} /> {setAlert ? "Remove price alert" : "Also set a price alert"}
          </button>

          {setAlert && (
            <div className="iv-form-row" style={{ marginTop: 16, marginBottom: 4 }}>
              <label className="iv-field">
                <span>Condition</span>
                <Select
                  value={condition}
                  onChange={setCondition}
                  options={[{ value: "above", label: "Rises above" }, { value: "below", label: "Falls below" }]}
                />
              </label>
              <label className="iv-field">
                <span>Target price</span>
                <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={stock.price.toFixed(2)} />
              </label>
            </div>
          )}

          <button type="submit" className="iv-btn-primary" style={{ marginTop: 20, width: "100%" }}>
            {watched ? "Save" : "Add to watchlist"}{setAlert ? " & set alert" : ""}
          </button>
        </form>
      </div>
    </div>
  );
}