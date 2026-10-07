"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, ChevronRight, Plus, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { readQueryParam, replaceQueryParams } from "@/lib/view-state";
import { fetchGlobalMovers, fetchNgMovers, fetchNgIndices, fetchGlobalIndices, NIGERIA_NEWS_CATEGORIES } from "@/lib/api";
import { getGlobalNews, getNgNews, hoursAgo } from "@/lib/news";
import { formatMoney } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";
import WatchAlertModal from "@/components/WatchAlertModal";
import Select from "@/components/Select";
import SkeletonStat from "@/components/SkeletonStat";
import SkeletonTableRow from "@/components/SkeletonTableRow";
import SkeletonHero from "@/components/SkeletonHero";
import NewsSummary from "@/components/NewsSummary";
import { useAuthGate } from "@/components/AuthGate";



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

const NIGERIA_NEWS_TABS = NIGERIA_NEWS_CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  source: category.id
}));

function defaultDashboardTab(region) {
  return region === "Africa" ? NIGERIA_NEWS_TABS[0].id : GLOBAL_NEWS_TABS[0].id;
}

function truncateNewsSummary(summary = "") {
  const text = String(summary);
  return `${text.split("\n\n")[0]}`;
}


function normalizeIndices(payload = [], assetType = null) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return items.map((item) => {
    const changePct = Number(
      item.price_change_percent ??
      item.percent_change ??
      item.changePct ??
      item.PercChange ??
      0
    );
    const value = Number(
      item.current_value ??
      item.current_price ??
      item.value ??
      item.Value ??
      item.price ??
      0
    );

    return {
      name: item.index_name || item.index || item.name || item.Symbol || item.symbol || "Index",
      ticker: item.symbol || item.Symbol || item.proxy_symbol || "",
      value,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      history: [],
      assetType
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
  const { state, region: storeRegion, setRegion, getAllLiveStocks, getFeaturedLiveStocks, toggleWatch, addAlert } = useStore();
  const { requireAuth } = useAuthGate();
  const router = useRouter();

  const [region, setPageRegion] = useState(storeRegion);
  const [newsTab, setNewsTab] = useState(() => defaultDashboardTab(storeRegion));
  const [newsCountry, setNewsCountry] = useState("Nigeria");
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [watchModalStock, setWatchModalStock] = useState(null);
  const [ngIndices, setNgIndices] = useState([]);
  const [marketMoversLoading, setMarketMoversLoading] = useState(true);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const isNg = region === "Africa";

  useEffect(() => {
    const savedRegion = readQueryParam("region");
    const nextRegion = NEWS_REGIONS.includes(savedRegion) ? savedRegion : storeRegion;
    const categories = nextRegion === "Africa" ? NIGERIA_NEWS_TABS : GLOBAL_NEWS_TABS;
    const savedTab = readQueryParam("category");
    setPageRegion(nextRegion);
    setRegion(nextRegion);
    setNewsTab(categories.some((tab) => tab.id === savedTab) ? savedTab : defaultDashboardTab(nextRegion));
    setNewsCountry(AFRICA_COUNTRIES.includes(readQueryParam("country")) ? readQueryParam("country") : "Nigeria");
    setUrlHydrated(true);
  }, []);

  useEffect(() => {
    if (!urlHydrated) return;
    replaceQueryParams({ region, category: newsTab, country: isNg ? newsCountry : null });
  }, [urlHydrated, region, newsTab, newsCountry, isNg]);


  useEffect(() => {
    if (!urlHydrated) return undefined;
    let cancelled = false;
    setNewsLoading(true);
    setNewsError(false);
    setNews([]);
    const tabs = isNg ? NIGERIA_NEWS_TABS : GLOBAL_NEWS_TABS;
    const selectedTab = tabs.find((t) => t.id === newsTab) || tabs[1];
    const loader = isNg ? getNgNews(selectedTab.source) : getGlobalNews(selectedTab.source);

    loader
      .then((items) => {
        if (!cancelled) {
          setNews(items);
        }
      })
      .catch(() => { if (!cancelled) setNewsError(true); })
      .finally(() => { if (!cancelled) setNewsLoading(false); });
    return () => { cancelled = true; };
  }, [newsTab, isNg, urlHydrated]);



  useEffect(() => {
    let cancelled = false;

    async function loadIndices() {
      setMarketMoversLoading(true);
      setNgIndices([]);

      const [indicesResult] = await Promise.allSettled([
        isNg ? fetchNgIndices() : fetchGlobalIndices()
      ]);

      if (cancelled) return;

      if (indicesResult.status === "fulfilled") {
        setNgIndices(normalizeIndices(indicesResult.value, isNg ? "ng_index" : null));
      }

      setMarketMoversLoading(false);
    }

    loadIndices();
    return () => { cancelled = true; };
  }, [isNg]);


  const stocks = getAllLiveStocks();
  const featured = getFeaturedLiveStocks()
  const summaryIndexes = [...ngIndices.slice()];

  const [hero, ...restNews] = news;
  const newsCards = restNews.slice(0, 3);

  function handleRegionChange(value) {
    setPageRegion(value);
    setRegion(value);
    setNewsCountry("Nigeria");
    setNewsTab(defaultDashboardTab(value));
  }



  return (
    <>
      <PageFrame>

        <div className="iv-filter-bar">
          <Select compact label="Region" value={region} onChange={handleRegionChange} options={NEWS_REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" value={newsCountry} onChange={setNewsCountry} options={AFRICA_COUNTRIES} />
          )}
        </div>

        {/* Featured hero + news list */}
        <div className="iv-panel iv-home-news-panel">
          <div className="iv-home-news-head">
            <div className="iv-dashboard-category-tabs iv-news-tabs iv-home-news-tabs">
              {(region === "Africa" ? NIGERIA_NEWS_TABS : GLOBAL_NEWS_TABS).map((t) => (
                <button key={t.id} className={"iv-news-tab" + (newsTab === t.id ? " active" : "")} onClick={() => setNewsTab(t.id)}>
                  <span className="iv-tab-full">{t.label}</span>
                  <span className="iv-tab-short">{t.short}</span>
                </button>
              ))}
            </div>
            <div className="iv-dashboard-category-select">
              <Select
                compact
                label="Category"
                value={newsTab}
                onChange={setNewsTab}
                options={(region === "Africa" ? NIGERIA_NEWS_TABS : GLOBAL_NEWS_TABS).map((t) => ({ value: t.id, label: t.label }))}
              />
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
              <a className="iv-home-hero" href={hero.url} target="_blank">
                <div className="iv-home-hero-image" style={{ backgroundImage: "url(" + hero.image + ")" }} />
                <div className="iv-home-hero-scrim" />
                <div className="iv-home-hero-body">
                  <span className="iv-home-hero-label">{hero.source} <ExternalLink size={12} /></span>
                  <h2>{hero.headline}</h2>
                  <NewsSummary className="iv-sub">{truncateNewsSummary(hero.summary)}</NewsSummary>
                </div>
              </a>
            ) : (
              <a className="iv-home-hero" href={hero.url} target="_blank" style={{ backgroundImage: "none" }} >
                <div className="iv-home-hero-body" style={{ position: "static" }}>
                  <span className="iv-home-hero-label">{hero.source} <ExternalLink size={12} /></span>
                  <h2>{hero.headline}</h2>
                  <NewsSummary className="iv-sub">{truncateNewsSummary(hero.summary)}</NewsSummary>
                </div>
              </a>
            )
          )}

          {newsCards.length > 0 && (
            <div className="iv-home-news-list">
              {newsCards.map((n) => (
                <a key={n.id} className="iv-news-row" href={n.url} target="_blank">
                  {n.image && <div className="iv-news-thumb" style={{ backgroundImage: "url(" + n.image + ")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />}
                  <div className="iv-news-row-body">
                    <div className="iv-news-headline">{n.headline}</div>
                    <NewsSummary className="iv-sub">{truncateNewsSummary(n.summary)}</NewsSummary>
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
                <div
                  key={ix.ticker || ix.name}
                  className="iv-stat"
                  role="link"
                  tabIndex={ix.assetType ? 0 : undefined}
                  style={{ cursor: ix.assetType ? "pointer" : "default" }}
                  onClick={() => { if (ix.assetType) router.push(`/stock/${encodeURIComponent(ix.ticker)}?asset=${ix.assetType}`); }}
                  onKeyDown={(event) => { if (ix.assetType && (event.key === "Enter" || event.key === " ")) router.push(`/stock/${encodeURIComponent(ix.ticker)}?asset=${ix.assetType}`); }}
                >
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