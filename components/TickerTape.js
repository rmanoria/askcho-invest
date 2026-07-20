"use client";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";

export default function TickerTape() {
  const { getAllLiveStocks } = useStore();
  const stocks = getAllLiveStocks();
  const row = [...stocks, ...stocks];
  return (
    <div className="iv-ticker">
      <div className="iv-ticker-track">
        {row.map((s, i) => (
          <span key={i} className="iv-ticker-item">
            <span className="mono">{s.ticker}</span>
            <span className={"iv-chg xs " + (s.changePct >= 0 ? "pos" : "neg")}>
              {s.changePct >= 0 ? "\u25b2" : "\u25bc"} {formatMoney(s.price, s.currency)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
