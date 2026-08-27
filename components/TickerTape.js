"use client";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import FlashValue from "./FlashValue";

export default function TickerTape() {
  const { getFeaturedLiveStocks, stocksLoading } = useStore();
  const stocks = getFeaturedLiveStocks();

  if (stocksLoading && stocks.length === 0) {
    return (
      <div className="iv-ticker">
        <div className="iv-ticker-track">
          <span className="iv-ticker-item muted">Loading live prices\u2026</span>
        </div>
      </div>
    );
  }

  const row = [...stocks, ...stocks];
  return (
    <div className="iv-ticker">
      <div className="iv-ticker-track">
        {row.map((s, i) => (
          <span key={i} className="iv-ticker-item">
            <span className="mono">{s.ticker}</span>
            <FlashValue
              value={s.price}
              className={"iv-chg xs " + (s.changePct >= 0 ? "pos" : "neg")}
              render={() => <>{s.changePct >= 0 ? "\u25b2" : "\u25bc"} {formatMoney(s.price, s.currency)}</>}
            />
          </span>
        ))}
      </div>
    </div>
  );
}