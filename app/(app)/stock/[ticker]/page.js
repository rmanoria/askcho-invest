"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Star, Newspaper, BellRing } from "lucide-react";
import { useStore } from "@/lib/store";
import { getMockNews } from "@/lib/stocks";
import { formatMoney, formatCompact, formatNGN } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import PriceChart from "@/components/PriceChart";
import Stat from "@/components/Stat";
import MarketBadge from "@/components/MarketBadge";
import TradePanel from "@/components/TradePanel";
import FlashValue from "@/components/FlashValue";

export default function StockPage() {
  const { ticker } = useParams();
  const router = useRouter();
  const { state, getLiveStock, toggleWatch, addAlert } = useStore();
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState("above");

  const s = getLiveStock(String(ticker).toUpperCase());
  if (!s) {
    return (
      <>
        <Topbar title="Stock not found" />
        <div className="iv-view"><p className="iv-empty-sm">We couldn't find that ticker.</p></div>
      </>
    );
  }

  const watched = state.watchlist.includes(s.ticker);
  const holding = state.portfolio.find((h) => h.ticker === s.ticker);
  const last5 = s.history.slice(-5).map((p) => p.price);
  const dayHigh = Math.max(...last5);
  const dayLow = Math.min(...last5);
  const prevClose = s.history[s.history.length - 2] ? s.history[s.history.length - 2].price : s.price;
  const news = getMockNews(s.ticker);

  function submitAlert(e) {
    e.preventDefault();
    const price = Number(alertPrice);
    if (!price) return;
    addAlert(s.ticker, alertCondition, price);
    setAlertPrice("");
  }

  return (
    <>
      <Topbar title={s.ticker} />
      <TickerTape />
      <div className="iv-view">
        <button className="iv-btn-ghost sm" onClick={() => router.back()} style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="iv-grid-2">
          <div>
            <div className="iv-panel">
              <div className="iv-panel-head">
                <div>
                  <MarketBadge market={s.market} />
                  <h2 style={{ marginTop: 8 }}>{s.name}</h2>
                  <span className="mono muted">{s.ticker} &middot; {s.sector}</span>
                </div>
                <button className="iv-star-btn lg" onClick={() => toggleWatch(s.ticker)} aria-label="Toggle watchlist">
                  <Star size={18} fill={watched ? "#ffffff" : "none"} />
                </button>
              </div>
              <div className="iv-price-row lg">
                <span className="iv-price mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></span>
                <span className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                  {s.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(s.changePct).toFixed(2)}%
                </span>
              </div>
              <PriceChart history={s.history} positive={s.changePct >= 0} currency={s.currency} height={220} />

              <div className="iv-stat-strip small">
                <Stat label="Prev close" value={formatMoney(prevClose, s.currency)} />
                <Stat label="Day high" value={formatMoney(dayHigh, s.currency)} />
                <Stat label="Day low" value={formatMoney(dayLow, s.currency)} />
                <Stat label="P/E ratio" value={s.peRatio} info="Price divided by earnings per share. Compares a stock's price to its profit." />
                <Stat label="Market cap" value={formatCompact(s.marketCap, s.currency)} info="Share price times total shares outstanding \u2014 a measure of company size." />
              </div>

              {holding && (
                <div className="iv-holding-note">
                  You own <span className="mono">{holding.shares}</span> shares &middot; avg cost {formatNGN(holding.avgCostNGN)}
                </div>
              )}
            </div>

            <div className="iv-panel">
              <div className="iv-panel-head"><h3>News</h3><Newspaper size={16} className="muted" /></div>
              <div className="iv-notif-list">
                {news.map((n) => (
                  <div key={n.id} className="iv-notif-item">
                    <div>{n.headline}</div>
                    <div className="iv-sub">{n.source} &middot; {n.hoursAgo}h ago</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="iv-col-stack">
            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Trade</h3></div>
              <TradePanel stock={s} />
            </div>

            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Price alert</h3><BellRing size={16} className="muted" /></div>
              <form onSubmit={submitAlert}>
                <div className="iv-form-row">
                  <label className="iv-field">
                    <span>Condition</span>
                    <select value={alertCondition} onChange={(e) => setAlertCondition(e.target.value)}>
                      <option value="above">Rises above</option>
                      <option value="below">Falls below</option>
                    </select>
                  </label>
                  <label className="iv-field">
                    <span>Target price ({s.currency})</span>
                    <input type="number" step="0.01" min="0" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} placeholder={s.price.toFixed(2)} />
                  </label>
                </div>
                <button type="submit" className="iv-btn-primary full">Set alert</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
