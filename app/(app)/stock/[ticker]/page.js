"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Star, Newspaper, BellRing, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { getGlobalNews } from "@/lib/news";
import { formatMoney } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import PriceChart from "@/components/PriceChart";
import Stat from "@/components/Stat";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";
import Select from "@/components/Select";
import { useAuthGate } from "@/components/AuthGate";

export default function StockPage() {
  const { ticker } = useParams();
  const router = useRouter();
  const { state, getLiveStock, toggleWatch, addAlert, stocksLoading } = useStore();
  const { requireAuth } = useAuthGate();
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState("above");
  const [marketNews, setMarketNews] = useState([]);

  useEffect(() => {
    getGlobalNews("general").then(setMarketNews).catch(() => setMarketNews([]));
  }, []);

  const s = getLiveStock(String(ticker).toUpperCase());

  if (!s) {
    return (
      <>
        <PageFrame title="Stock not found">
          <p className="iv-empty-sm">{stocksLoading ? "Loading live prices\u2026" : "We couldn't find that ticker."}</p>
        </PageFrame>
      </>
    );
  }

  const watched = state.watchlist.includes(s.ticker);
  const hasOHLC = s.dayHigh !== null && s.dayLow !== null;

  function submitAlert(e) {
    e.preventDefault();
    const price = Number(alertPrice);
    if (!price) return;
    requireAuth(() => {
      addAlert(s.ticker, alertCondition, price);
      setAlertPrice("");
    });
  }

  return (
    <>
      <PageFrame title={s.ticker}>
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
                <button className="iv-star-btn lg" onClick={() => requireAuth(() => toggleWatch(s.ticker))} aria-label="Toggle watchlist">
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
                <Stat label="Prev close" value={formatMoney(s.prevClose, s.currency)} />
                {hasOHLC && <Stat label="Day high" value={formatMoney(s.dayHigh, s.currency)} />}
                {hasOHLC && <Stat label="Day low" value={formatMoney(s.dayLow, s.currency)} />}
                {hasOHLC && <Stat label="Open" value={formatMoney(s.openPrice, s.currency)} />}
              </div>
            </div>

            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Market news</h3><Newspaper size={16} className="muted" /></div>
              <p className="iv-sub" style={{ marginBottom: 10 }}>General market headlines \u2014 not specific to {s.ticker}.</p>
              <div className="iv-notif-list">
                {marketNews.slice(0, 5).map((n) => (
                  <a key={n.id} className="iv-notif-item" href={n.url} style={{ display: "block" }}>
                    <div>{n.headline} <ExternalLink size={12} className="muted" /></div>
                    <div className="iv-sub">{n.source}</div>
                  </a>
                ))}
                {marketNews.length === 0 && <p className="iv-empty-sm">No market news available right now.</p>}
              </div>
            </div>
          </div>

          <div className="iv-col-stack">
            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Price alert</h3><BellRing size={16} className="muted" /></div>
              <form onSubmit={submitAlert}>
                <div className="iv-form-row">
                  <label className="iv-field">
                    <span>Condition</span>
                    <Select
                      value={alertCondition}
                      onChange={setAlertCondition}
                      options={[{ value: "above", label: "Rises above" }, { value: "below", label: "Falls below" }]}
                    />
                  </label>
                  <label className="iv-field">
                    <span>Target price ({s.currency})</span>
                    <input type="number" step="0.01" min="0" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} placeholder={s.price.toFixed(2)} />
                  </label>
                </div>
                <button type="submit" className="iv-btn-primary full">Set alert</button>
              </form>
            </div>

            <button className={"iv-btn-ghost full" + (watched ? "" : "")} onClick={() => requireAuth(() => toggleWatch(s.ticker))} style={{ marginTop: 0 }}>
              <Star size={15} fill={watched ? "#ffffff" : "none"} /> {watched ? "Remove from watchlist" : "Add to watchlist"}
            </button>
          </div>
        </div>
      </PageFrame>
    </>
  );
}