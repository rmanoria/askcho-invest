"use client";
import { useRouter } from "next/navigation";
import { Star, X, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import Sparkline from "@/components/Sparkline";

export default function WatchlistPage() {
  const { state, getAllLiveStocks, toggleWatch } = useStore();
  const router = useRouter();
  const stocks = getAllLiveStocks().filter((s) => state.watchlist.includes(s.ticker));

  return (
    <>
      <Topbar title="Watchlist" />
      <TickerTape />
      <div className="iv-view">
        {stocks.length === 0 ? (
          <div className="iv-panel iv-empty-state">
            <Star size={28} className="muted" />
            <h3>No stocks watched yet</h3>
            <p>Star a stock from Search to track it here.</p>
          </div>
        ) : (
          <div className="iv-watch-grid">
            {stocks.map((s) => (
              <div key={s.ticker} className="iv-panel iv-watch-card">
                <div className="iv-panel-head">
                  <div>
                    <div className="mono">{s.ticker}</div>
                    <div className="iv-sub">{s.name}</div>
                  </div>
                  <button className="iv-star-btn" onClick={() => toggleWatch(s.ticker)} aria-label="Remove from watchlist">
                    <X size={15} />
                  </button>
                </div>
                <Sparkline data={s.history.slice(-30)} positive={s.changePct >= 0} />
                <div className="iv-price-row">
                  <span className="mono">{formatMoney(s.price, s.currency)}</span>
                  <span className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                    {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                  </span>
                </div>
                <button className="iv-btn-ghost sm full" onClick={() => router.push("/stock/" + s.ticker)}>View details <ChevronRight size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
