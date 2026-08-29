"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, ChevronRight, ChevronLeft as ChevronLeftIcon, Plus, ExternalLink, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { fetchGlobalMovers, fetchNgMovers, fetchNgIndices } from "@/lib/api";
import { getGlobalNews, getNgNews, hoursAgo } from "@/lib/news";
import { getCalendarEvents } from "@/lib/markets";
import { formatMoney, formatDate } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";
import WatchAlertModal from "@/components/WatchAlertModal";
import Select from "@/components/Select";
import SkeletonStat from "@/components/SkeletonStat";
import SkeletonTableRow from "@/components/SkeletonTableRow";
import SkeletonHero from "@/components/SkeletonHero";
import { useAuthGate } from "@/components/AuthGate";

const INSIGHT_TABS = [
  { id: "gainers", label: "Top gainers", short: "Gainers" },
  { id: "losers", label: "Top losers", short: "Losers" },
];

// Region/Country is the real NG-vs-Global split; Category tabs then pick which
// real category to show within the Global feed (all four map cleanly, no hijacking).
const NEWS_REGIONS = ["Global", "Africa"] // const NEWS_REGIONS = ["Africa", "America", "Europe", "Asia", "Global"];
const AFRICA_COUNTRIES = ["Nigeria"];
const GLOBAL_NEWS_TABS = [
  { id: "general", label: "General", short: "General", source: "general" },
  { id: "merger", label: "Merger", short: "Merger", source: "merger" },
  { id: "forex", label: "Forex", short: "Forex", source: "forex" },
  { id: "crypto", label: "Cryptocurrency", short: "Crypto", source: "crypto" },
];

const NIGERIA_NEWS_TABS = [
  { id: "corporate-news", label: "Corporate", short: "Corporate", source: "corporate-news" },
  { id: "economy", label: "Economy", short: "Economy", source: "economy" },
  { id: "industries", label: "Industries", short: "Industries", source: "industries" },
  { id: "technology", label: "Technology", short: "Technology", source: "technology" },
  { id: "personal-finance", label: "Personal Finance", short: "Finance", source: "personal-finance" },
  { id: "product-updates", label: "Product Updates", short: "Updates", source: "product-updates" }
];

function normalizeMoversArray(items = []) {
  return items.map((item, idx) => {
    const changePercentage = Number(String(item.change_percentage ?? item.changePct ?? item.change ?? "0").replace(/[%,%]/g, ""));
    const price = Number(item.price ?? item.last_price ?? 0);

    return {
      id: item.ticker || item.symbol || `mover-${idx}`,
      ticker: item.ticker || item.symbol || `G-${idx}`,
      name: item.company || item.name || item.ticker || item.symbol || "Global stock",
      market: "Global",
      price,
      changePct: Number.isFinite(changePercentage) ? changePercentage : 0,
      currency: "USD"
    };
  });
}

function normalizeNgIndices(items = []) {
  return items.map((item) => {
    const changePct = Number(item.price_change_percent ?? item.changePct ?? 0);
    const value = Number(item.current_value ?? item.value ?? 0);

    return {
      name: item.index_name || item.symbol || "NG Index",
      value,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      history: [] // No history data from API yet
    };
  });
}

function normalizeNgMovers(payload) {
  const list = Array.isArray(payload?.data?.data) ? payload.data.data : Array.isArray(payload?.data) ? payload.data : [];

  return list.slice(0, 8).map((item, idx) => ({
    id: item.slug || item.title || `ng-mover-${idx}`,
    ticker: item.company || item.symbol || `NGX-${idx}`,
    name: item.title || item.slug || "NG market move",
    market: "NGX",
    price: null,
    changePct: null,
    currency: "NGN",
    source: "ng",
    url: item.url || "",
    summary: item.excerpt || item.summary || ""
  }));
}

export default function DashboardPage() {
  const { state, getAllLiveStocks, getFeaturedLiveStocks, getLiveIndexes, toggleWatch, addAlert } = useStore();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [insightTab, setInsightTab] = useState("gainers");
  const [insightDir, setInsightDir] = useState("next");
  const [newsTab, setNewsTab] = useState("featured");
  const [newsRegion, setNewsRegion] = useState("Africa");
  const [newsCountry, setNewsCountry] = useState("Nigeria");
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [globalGainers, setGlobalGainers] = useState([]);
  const [globalLosers, setGlobalLosers] = useState([]);
  const [ngIndices, setNgIndices] = useState([]);
  const [marketMoversLoading, setMarketMoversLoading] = useState(true);
  const [watchModalStock, setWatchModalStock] = useState(null);
  const insightIndex = INSIGHT_TABS.findIndex((t) => t.id === insightTab);
  const touchX = useRef(null);
  // Nigeria is the only African news source available, so Region: Africa always
  // means the NG feed regardless of the Country sub-choice.
  const isNg = newsRegion === "Africa";

  useEffect(() => {
    let cancelled = false;
    setNewsLoading(true);
    setNewsError(false);
    setNews([]);
    const tabs = isNg ? NIGERIA_NEWS_TABS : GLOBAL_NEWS_TABS;
    const selectedTab = tabs.find((t) => t.id === newsTab) || tabs[0];
    const loader = isNg ? getNgNews(selectedTab.source) : getGlobalNews(selectedTab.source);

    loader
      .then((items) => {
        if (!cancelled) {
          setNews(items);
          console.log(items[0]);
        }
      })
      .catch(() => { if (!cancelled) setNewsError(true); })
      .finally(() => { if (!cancelled) setNewsLoading(false); });
    return () => { cancelled = true; };
  }, [newsTab, isNg]);

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
  useEffect(() => {
    let cancelled = false;

    async function loadMovers() {
      try {
        const [globalPayload, ngIndicesPayload] = await Promise.all([fetchGlobalMovers(), fetchNgIndices()]);
        if (cancelled) return;
        setGlobalGainers(normalizeMoversArray(globalPayload?.top_gainers || []));
        setGlobalLosers(normalizeMoversArray(globalPayload?.top_losers || []));
        setNgIndices(normalizeNgIndices(Array.isArray(ngIndicesPayload) ? ngIndicesPayload : []));
      } catch (e) {
        if (!cancelled) {
          setGlobalGainers([]);
          setGlobalLosers([]);
          setNgIndices([]);
        }
      } finally {
        if (!cancelled) setMarketMoversLoading(false);
      }
    }

    loadMovers();
    return () => { cancelled = true; };
  }, []);

  const stocks = getAllLiveStocks();
  const featured = getFeaturedLiveStocks();
  const indexes = getLiveIndexes();
  const summaryIndexes = [...indexes, ...ngIndices.slice()];

  const [hero, ...restNews] = news;
  const newsCards = restNews.slice(0, 3);

  // Use real API data, fall back to live stocks if needed
  const gainers = globalGainers.length ? globalGainers : [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 6);
  const losers = globalLosers.length ? globalLosers : [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 6);
  const topGainers = gainers.slice(0, 4);

  const events = getCalendarEvents().slice(0, 6);

  return (
    <>
      <PageFrame>

        <div className="iv-filter-bar">
          <Select compact label="Region" value={newsRegion} onChange={(v) => { setNewsRegion(v); setNewsCountry("Nigeria"); setNewsTab(v === "Africa" ? "general" : "featured"); }} options={NEWS_REGIONS} />
          {newsRegion === "Africa" && (
            <Select compact label="Country" value={newsCountry} onChange={setNewsCountry} options={AFRICA_COUNTRIES} />
          )}
        </div>

        {/* Featured hero + news list */}
        <div className="iv-panel iv-home-news-panel">
          <div className="iv-home-news-head">
            <div className="iv-news-tabs iv-home-news-tabs">
              {(newsRegion === "Africa" ? NIGERIA_NEWS_TABS : GLOBAL_NEWS_TABS).map((t) => (
                <button key={t.id} className={"iv-news-tab" + (newsTab === t.id ? " active" : "")} onClick={() => setNewsTab(t.id)}>
                  <span className="iv-tab-full">{t.label}</span>
                  <span className="iv-tab-short">{t.short}</span>
                </button>
              ))}
            </div>
          </div>

          {!newsLoading && newsError && (
            <p className="iv-empty-sm">Couldn&apos;t load {isNg ? "Nigeria" : "global"} news right now. Try again later.</p>
          )}

          {!newsLoading && !newsError && !hero && (
            <p className="iv-empty-sm">No {isNg ? "Nigeria" : "global"} news right now.</p>
          )}

          {newsLoading && <SkeletonHero />}

          {hero && (
            hero.image ? (
              <a className="iv-home-hero" href={hero.url}>
                <div className="iv-home-hero-image" style={{ backgroundImage: "url(" + hero.image + ")" }} />
                <div className="iv-home-hero-scrim" />
                <div className="iv-home-hero-body">
                  <span className="iv-home-hero-label">{hero.source} <ExternalLink size={12} /></span>
                  <h2>{hero.headline}</h2>
                  <div className="iv-sub">{hero.summary} </div>
                </div>
              </a>
            ) : (
              <a className="iv-home-hero" href={hero.url} style={{ backgroundImage: "none" }}>
                <div className="iv-home-hero-body" style={{ position: "static" }}>
                  <span className="iv-home-hero-label">{hero.source} <ExternalLink size={12} /></span>
                  <h2>{hero.headline}</h2>
                  <div className="iv-sub">{hero.summary} </div>
                </div>
              </a>
            )
          )}

          {newsCards.length > 0 && (
            <div className="iv-home-news-list">
              {newsCards.map((n) => (
                <a key={n.id} className="iv-news-row" href={n.url}>
                  {n.image && <div className="iv-news-thumb" style={{ backgroundImage: "url(" + n.image + ")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />}
                  <div className="iv-news-row-body">
                    <div className="iv-news-headline">{n.headline}</div>
                    <div className="iv-sub">{n.summary} </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Markets summary */}
        <div className="iv-panel">
          <div className="iv-panel-head">
            <h3>Markets summary</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="iv-btn-ghost sm" onClick={() => requireAuth(() => setWatchModalStock(topGainers[0] || featured[0]))}><Plus size={14} /> Watch &amp; alert</button>
              <Link href="/markets" className="iv-btn-ghost sm">All markets <ChevronRight size={14} /></Link>
            </div>
          </div>
          <div className="iv-stat-strip index" style={{ marginBottom: 0 }}>
            {marketMoversLoading && ngIndices.length === 0 ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              summaryIndexes.map((ix) => (
                <div key={ix.name} className="iv-stat">
                  <div className="iv-stat-label">{ix.name}</div>
                  <div className="iv-stat-value mono"><FlashValue value={ix.value} render={() => ix.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} /></div>
                  <div className={"iv-chg " + (ix.changePct >= 0 ? "pos" : "neg")}>
                    {ix.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {Math.abs(ix.changePct).toFixed(2)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Market insights \u2014 movers / gainers / losers / calendar as a swipeable 3D card carousel */}
        <div className="iv-panel iv-insight-panel">
          <div className="iv-insight-head">
            <div className="iv-news-tabs iv-home-news-tabs">
              {INSIGHT_TABS.map((t) => (
                <button key={t.id} className={"iv-news-tab" + (insightTab === t.id ? " active" : "")} onClick={() => goToInsight(t.id)}>
                  <span className="iv-tab-full">{t.label}</span>
                  <span className="iv-tab-short">{t.short}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="iv-insight-nav-btn edge left" onClick={insightPrev} aria-label="Previous"><ChevronLeftIcon size={17} /></button>
          <button className="iv-insight-nav-btn edge right" onClick={insightNext} aria-label="Next"><ChevronRight size={17} /></button>

          <div className="iv-insight-viewport" onTouchStart={onInsightTouchStart} onTouchEnd={onInsightTouchEnd}>
            <div key={insightTab} className={"iv-insight-slide dir-" + insightDir}>



              {insightTab === "gainers" && (
                <div className="iv-table-wrap"><table className="iv-table">
                  <thead><tr><th>Stock</th><th>Change</th><th>Price</th></tr></thead>
                  <tbody>
                    {!marketMoversLoading && gainers.map((s) => (
                      <tr key={s.id || s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                        <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                        <td className="mono iv-pos-text">+{s.changePct.toFixed(2)}%</td>
                        <td className="mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></td>
                      </tr>
                    ))}
                    {marketMoversLoading && gainers.length === 0 && (
                      <>
                        <SkeletonTableRow colCount={3} />
                        <SkeletonTableRow colCount={3} />
                        <SkeletonTableRow colCount={3} />
                        <SkeletonTableRow colCount={3} />
                      </>
                    )}
                    {!marketMoversLoading && gainers.length === 0 && (
                      <tr><td colSpan={3} className="iv-empty-sm">No top gainers available right now.</td></tr>
                    )}
                  </tbody>
                </table></div>
              )}

              {insightTab === "losers" && (
                <div className="iv-table-wrap"><table className="iv-table">
                  <thead><tr><th>Stock</th><th>Change</th><th>Price</th></tr></thead>
                  <tbody>
                    {!marketMoversLoading && losers.map((s) => (
                      <tr key={s.id || s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                        <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                        <td className="mono iv-neg-text">{s.changePct.toFixed(2)}%</td>
                        <td className="mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></td>
                      </tr>
                    ))}
                    {marketMoversLoading && losers.length === 0 && (
                      <>
                        <SkeletonTableRow colCount={3} />
                        <SkeletonTableRow colCount={3} />
                        <SkeletonTableRow colCount={3} />
                        <SkeletonTableRow colCount={3} />
                      </>
                    )}
                    {!marketMoversLoading && losers.length === 0 && (
                      <tr><td colSpan={3} className="iv-empty-sm">No top losers available right now.</td></tr>
                    )}
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

      </PageFrame>

      <WatchAlertModal
        open={!!watchModalStock}
        stock={watchModalStock}
        stocks={featured}
        onChangeStock={(ticker) => setWatchModalStock(featured.find((s) => s.ticker === ticker))}
        onClose={() => setWatchModalStock(null)}
        watched={watchModalStock ? state.watchlist.includes(watchModalStock.ticker) : false}
        onToggleWatch={toggleWatch}
        onCreateAlert={addAlert}
      />
    </>
  );
}