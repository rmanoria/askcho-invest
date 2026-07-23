"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, X, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import PriceChart from "@/components/PriceChart";
import Sparkline from "@/components/Sparkline";
import FlashValue from "@/components/FlashValue";

export default function WatchlistPage() {
  const { state, getAllLiveStocks, toggleWatch } = useStore();
  const router = useRouter();
  const stocks = getAllLiveStocks().filter((s) => state.watchlist.includes(s.ticker));
  const spotlight = [...stocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];

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
          <>
            {spotlight && (
              <div className="iv-panel">
                <div className="iv-panel-head">
                  <div>
                    <div className="iv-eyebrow">SPOTLIGHT</div>
                    <h3>{spotlight.name} <span className="mono muted">{spotlight.ticker}</span></h3>
                  </div>
                  <Link href={"/stock/" + spotlight.ticker} className="iv-btn-ghost sm">View details <ChevronRight size={14} /></Link>
                </div>
                <div className="iv-price-row">
                  <span className="iv-price mono"><FlashValue value={spotlight.price} render={() => formatMoney(spotlight.price, spotlight.currency)} /></span>
                  <span className={"iv-chg " + (spotlight.changePct >= 0 ? "pos" : "neg")}>
                    {spotlight.changePct >= 0 ? "+" : ""}{spotlight.changePct.toFixed(2)}%
                  </span>
                </div>
                <PriceChart history={spotlight.history} positive={spotlight.changePct >= 0} currency={spotlight.currency} height={200} />
              </div>
            )}

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
                    <span className="mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></span>
                    <span className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </span>
                  </div>
                  <button className="iv-btn-ghost sm full" onClick={() => router.push("/stock/" + s.ticker)}>View details <ChevronRight size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
