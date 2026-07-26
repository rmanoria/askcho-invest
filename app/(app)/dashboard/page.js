"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, ChevronRight, ChevronLeft as ChevronLeftIcon, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { getAllNews } from "@/lib/news";
import { ALL_INDICES, getCalendarEvents } from "@/lib/markets";
import { formatMoney, formatDate } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";
import WatchAlertModal from "@/components/WatchAlertModal";

const INSIGHT_TABS = [
  { id: "movers", label: "Top movers" },
  { id: "under", label: "Most undervalued" },
  { id: "over", label: "Most overvalued" },
  { id: "calendar", label: "Calendar" }
];

const NEWS_TABS = [
  { id: "featured", label: "Featured" },
  { id: "breaking", label: "Breaking" },
  { id: "popular", label: "Most popular" },
  { id: "crypto", label: "Cryptocurrency" }
];

export default function DashboardPage() {
  const { state, getAllLiveStocks, getLiveIndexes, toggleWatch, addAlert } = useStore();
  const router = useRouter();
  const [insightTab, setInsightTab] = useState("movers");
  const [insightDir, setInsightDir] = useState("next");
  const [newsTab, setNewsTab] = useState("featured");
  const [watchModalStock, setWatchModalStock] = useState(null);
  const insightIndex = INSIGHT_TABS.findIndex((t) => t.id === insightTab);
  const touchX = useRef(null);

  function goToInsight(id) {
    const targetIndex = INSIGHT_TABS.findIndex((t) => t.id === id);
    setInsightDir(targetIndex >= insightIndex ? "next" : "prev");
    setInsightTab(id);
  }
  function insightNext() { setInsightDir("next"); setInsightTab(INSIGHT_TABS[(insightIndex + 1) % INSIGHT_TABS.length].id); }
  function insightPrev() { setInsightDir("prev"); setInsightTab(INSIGHT_TABS[(insightIndex - 1 + INSIGHT_TABS.length) % INSIGHT_TABS.length].id); }
  function onInsightTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onInsightTouchEnd(e) {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (delta < -40) insightNext();
    else if (delta > 40) insightPrev();
    touchX.current = null;
  }
  const stocks = getAllLiveStocks();
  const indexes = getLiveIndexes();
  const summaryIndexes = [...indexes, ...ALL_INDICES.slice(3, 6)];

  const news = getAllNews();
  const stockByTicker = Object.fromEntries(stocks.map((s) => [s.ticker, s]));
  const filteredNews =
    newsTab === "breaking" ? news.filter((n) => n.breaking) :
    newsTab === "popular" ? [...news].sort((a, b) => Math.abs((stockByTicker[b.ticker] || {}).changePct || 0) - Math.abs((stockByTicker[a.ticker] || {}).changePct || 0)) :
    newsTab === "crypto" ? [] :
    news;
  const [hero, ...restNews] = filteredNews;
  const newsCards = restNews.slice(0, 3);

  const sortedByChange = [...stocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const movers = sortedByChange.slice(0, 6);
  const topGainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 4);

  const equities = stocks.filter((s) => s.market !== "ETF");
  const undervalued = [...equities].sort((a, b) => a.peRatio - b.peRatio).slice(0, 5);
  const overvalued = [...equities].sort((a, b) => b.peRatio - a.peRatio).slice(0, 5);

  const events = getCalendarEvents().slice(0, 6);

  return (
    <>
      <Topbar />
      <TickerTape />
      <div className="iv-view">

        {/* Featured hero + news list */}
        <div className="iv-panel iv-home-news-panel">
          <div className="iv-news-tabs iv-home-news-tabs">
            {NEWS_TABS.map((t) => (
              <button key={t.id} className={"iv-news-tab" + (newsTab === t.id ? " active" : "")} onClick={() => setNewsTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {!hero && (
            <p className="iv-empty-sm">No {NEWS_TABS.find((t) => t.id === newsTab).label.toLowerCase()} news right now.</p>
          )}

          {hero && (
            <div className="iv-home-hero" onClick={() => router.push("/stock/" + hero.ticker)}>
              <div className="iv-home-hero-image" style={{ backgroundImage: "url(" + hero.image + ")" }} />
              <div className="iv-home-hero-scrim" />
              <div className="iv-home-hero-body">
                <span className="iv-home-hero-label">Featured</span>
                <h2>{hero.headline}</h2>
                <div className="iv-sub">{hero.source} &middot; {hero.hoursAgo}h ago</div>
              </div>
            </div>
          )}

          {newsCards.length > 0 && (
            <div className="iv-home-news-list">
              {newsCards.map((n) => (
                <div key={n.id} className="iv-news-row" onClick={() => router.push("/stock/" + n.ticker)}>
                  <div className="iv-news-thumb" style={{ backgroundImage: "url(" + n.image + ")" }} />
                  <div className="iv-news-row-body">
                    <div className="iv-news-headline">{n.headline}</div>
                    <div className="iv-sub">{n.source} &middot; {n.hoursAgo}h ago</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Markets summary */}
        <div className="iv-panel">
          <div className="iv-panel-head">
            <h3>Markets summary</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="iv-btn-ghost sm" onClick={() => setWatchModalStock(topGainers[0] || stocks[0])}><Plus size={14} /> Watch &amp; alert</button>
              <Link href="/markets" className="iv-btn-ghost sm">All markets <ChevronRight size={14} /></Link>
            </div>
          </div>
          <div className="iv-stat-strip index" style={{ marginBottom: 0 }}>
            {summaryIndexes.map((ix) => (
              <div key={ix.name} className="iv-stat">
                <div className="iv-stat-label">{ix.name}</div>
                <div className="iv-stat-value mono"><FlashValue value={ix.value} render={() => ix.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} /></div>
                <div className={"iv-chg " + (ix.changePct >= 0 ? "pos" : "neg")}>
                  {ix.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(ix.changePct).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market insights \u2014 movers / undervalued / overvalued / calendar as a swipeable 3D card carousel */}
        <div className="iv-panel iv-insight-panel">
          <div className="iv-insight-head">
            <div className="iv-news-tabs iv-home-news-tabs">
              {INSIGHT_TABS.map((t) => (
                <button key={t.id} className={"iv-news-tab" + (insightTab === t.id ? " active" : "")} onClick={() => goToInsight(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>

          <button className="iv-insight-nav-btn edge left" onClick={insightPrev} aria-label="Previous"><ChevronLeftIcon size={17} /></button>
          <button className="iv-insight-nav-btn edge right" onClick={insightNext} aria-label="Next"><ChevronRight size={17} /></button>

          <div className="iv-insight-viewport" onTouchStart={onInsightTouchStart} onTouchEnd={onInsightTouchEnd}>
            <div key={insightTab} className={"iv-insight-slide dir-" + insightDir}>

              {insightTab === "movers" && (
                <div className="iv-table-wrap"><table className="iv-table">
                  <thead><tr><th>Stock</th><th className="iv-col-hide-mobile">Market</th><th>Price</th><th>Change</th><th /></tr></thead>
                  <tbody>
                    {movers.map((s) => (
                      <tr key={s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                        <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                        <td className="iv-col-hide-mobile"><MarketBadge market={s.market} /></td>
                        <td className="mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></td>
                        <td className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>{s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%</td>
                        <td><ChevronRight size={14} className="muted" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {insightTab === "under" && (
                <div className="iv-table-wrap"><table className="iv-table">
                  <thead><tr><th>Stock</th><th>P/E</th><th>Price</th></tr></thead>
                  <tbody>
                    {undervalued.map((s) => (
                      <tr key={s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                        <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                        <td className="mono iv-pos-text">{s.peRatio}</td>
                        <td className="mono">{formatMoney(s.price, s.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {insightTab === "over" && (
                <div className="iv-table-wrap"><table className="iv-table">
                  <thead><tr><th>Stock</th><th>P/E</th><th>Price</th></tr></thead>
                  <tbody>
                    {overvalued.map((s) => (
                      <tr key={s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                        <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                        <td className="mono iv-neg-text">{s.peRatio}</td>
                        <td className="mono">{formatMoney(s.price, s.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              {insightTab === "calendar" && (
                <div className="iv-notif-list">
                  {events.map((e) => (
                    <div key={e.id} className="iv-notif-item" style={{ cursor: e.ticker ? "pointer" : "default" }} onClick={() => e.ticker && router.push("/stock/" + e.ticker)}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span>{e.title}</span>
                        <span className="iv-sub" style={{ textTransform: "uppercase", fontSize: 10.5 }}>{e.type}</span>
                      </div>
                      <div className="iv-sub">{formatDate(e.date)}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          <div className="iv-insight-dots">
            {INSIGHT_TABS.map((t, i) => (
              <button key={t.id} className={"iv-insight-dot" + (i === insightIndex ? " active" : "")} onClick={() => goToInsight(t.id)} aria-label={"Go to " + t.label} />
            ))}
          </div>
        </div>

      </div>

      <WatchAlertModal
        open={!!watchModalStock}
        stock={watchModalStock}
        stocks={stocks}
        onChangeStock={(ticker) => setWatchModalStock(stocks.find((s) => s.ticker === ticker))}
        onClose={() => setWatchModalStock(null)}
        watched={watchModalStock ? state.watchlist.includes(watchModalStock.ticker) : false}
        onToggleWatch={toggleWatch}
        onCreateAlert={addAlert}
      />
    </>
  );
}