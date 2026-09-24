"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Search, ChevronRight, ChevronLeft as ChevronLeftIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import Sparkline from "@/components/Sparkline";
import FlashValue from "@/components/FlashValue";
import Select from "@/components/Select";
import SkeletonTableRow from "@/components/SkeletonTableRow";
import {
  fetchNgIndices,
  fetchGlobalIndices,
  fetchGlobalCommodities,
  fetchGlobalCrypto,
  fetchGlobalForex,
  fetchGlobalEtfs,
  fetchGlobalMutualFunds,
  fetchGlobalStock,
  fetchNgForexRates,
  fetchNgCompanyChart,
  fetchNgIndexChart,
  fetchNgForexChart,
  fetchNgMovers,
  fetchGlobalMovers,
} from "@/lib/api";

const INSIGHT_TABS = [
  { id: "gainers", label: "Top gainers", short: "Gainers" },
  { id: "losers", label: "Top losers", short: "Losers" },
];

const REGIONS = ["Africa", "Global"];
// countries available once "Africa" is picked as the region — add more as data is added for them
const AFRICA_COUNTRIES = ["Nigeria", "All"];
const SORTS = [
  { value: "default", label: "Default" },
  { value: "change_desc", label: "High to low" },
  { value: "change_asc", label: "Low to high" },
  { value: "alpha", label: "A–Z" }
];
const PAGE_SIZE = 25;

// which live market feed belongs to which region — the API only distinguishes
// NG (Africa) vs Global (everything else priced in USD), no NASDAQ/NYSE/ETF split.
const REGION_MARKETS = { Africa: ["NGX"], Global: ["Global"] };

// Only instrument types backed by live backend feeds are exposed here.
function getInstrumentTypes(region) {
  const types = ["Indices"];
  if (REGION_MARKETS[region]) types.push("Stocks");
  types.push("Currencies", "Commodities", "Cryptocurrency", "ETFs", "Mutual Funds");
  return types;
}

// Only global stocks use the individual quote fallback. Other market types
// filter the live data already loaded on this page.
function isLiveSearchType(type, region) {
  return type === "Stocks" && region === "Global";
}

function matchesQuery(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const name = (item.name || "").toLowerCase();
  const ticker = (item.ticker || "").toLowerCase();
  return name.includes(q) || ticker.includes(q);
}

function getInstruments(region, type, stocks, live, searched, query) {
  if (type === "Indices") return live.indices.filter((item) => matchesQuery({ name: item.name, ticker: item.ticker }, query));
  if (type === "Stocks") {
    if (region === "Global") {
      return query ? searched.stocks ?? [] : stocks.filter((s) => (REGION_MARKETS[region] || []).includes(s.market));
    }
    return stocks.filter((s) => (REGION_MARKETS[region] || []).includes(s.market)).filter((item) => matchesQuery(item, query));
  }
  if (type === "Currencies") {
    const base = region === "Africa" ? live.ngCurrencies : live.currencies;
    return base.filter((item) => matchesQuery(item, query));
  }
  if (type === "Commodities") return live.commodities.filter((item) => matchesQuery(item, query));
  if (type === "Cryptocurrency") return live.crypto.filter((item) => matchesQuery(item, query));
  if (type === "ETFs") return live.etfs.filter((item) => matchesQuery(item, query));
  if (type === "Mutual Funds") return live.mutualFunds.filter((item) => matchesQuery(item, query));
  return [];
}

function itemPrice(item, isIndex) {
  if (isIndex) return Number(item.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (item.currency === "%") return Number(item.price ?? 0).toFixed(2) + "%";
  if (item.currency === "rate") return Number(item.price ?? 0).toFixed(4);
  return formatMoney(item.price, item.currency === "NGN" ? "NGN" : "USD");
}

function mapGlobalIndices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    name: item.index,
    ticker: item.proxy_symbol,
    value: item.current_price,
    changePct: item.percent_change ?? 0,
    region: "Global"
  }));
}

function mapNgIndices(raw) {
  const list = Array.isArray(raw) ? raw : raw?.data;
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    name: item.name || item.index_name || item.symbol || item.Symbol || "—",
    ticker: item.symbol || item.Symbol,
    value: Number(item.value ?? item.current_value ?? item.Value ?? 0),
    changePct: Number(item.percent_change ?? item.price_change_percent ?? item.changePct ?? item.PercChange ?? 0),
    region: "Africa",
    market: "NGX",
    assetType: "ng_index"
  }));
}

function mapNgForex(raw) {
  const rates = Array.isArray(raw) ? raw : raw?.rates;
  if (!Array.isArray(rates)) return [];
  return rates.filter((item) => item?.currency && item.rate != null).map((item) => ({
    ticker: `${item.currency}/NGN`,
    name: `${item.currency}/NGN`,
    source: item.currency,
    target: "NGN",
    price: Number(item.rate),
    changePct: Number(item.daily_change_percent ?? 0),
    currency: "NGN",
    market: "NG Forex",
    assetType: "ng_forex"
  }));
}

function mapCommodities(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => !item.error)
    .map((item) => ({
      ticker: item.ticker,
      name: item.commodity,
      price: item.latest_value,
      changePct: item.percent_change ?? 0,
      currency: "USD",
      market: item.unit || "Commodity"
    }));
}

function mapCrypto(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => !item.error)
    .map((item) => ({
      ticker: item.id,
      name: item.id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      price: item.price,
      changePct: item.percent_change_24h ?? 0,
      currency: item.currency || "USD",
      market: "Crypto"
    }));
}

function mapForex(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => !item.error)
    .map((item) => ({
      ticker: item.pair,
      name: item.pair,
      price: item.exchange_rate,
      changePct: 0,
      currency: "rate",
      market: "Forex"
    }));
}

function mapEtfs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => !item.error)
    .map((item) => ({
      ticker: item.symbol,
      name: item.symbol,
      price: item.current_price,
      changePct: item.percent_change ?? 0,
      currency: "USD",
      market: "ETF"
    }));
}

function mapMutualFunds(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => !item.error)
    .map((item) => ({
      ticker: item.symbol,
      name: item.symbol,
      price: item.nav,
      changePct: item.percent_change ?? 0,
      currency: "USD",
      market: "Mutual Fund"
    }));
}

function mapSearchedStock(raw) {
  if (!raw || raw.error || raw.current_price == null) return [];
  return [{
    ticker: raw.symbol,
    name: raw.symbol,
    price: raw.current_price,
    changePct: raw.percent_change ?? 0,
    currency: "USD",
    market: "Global"
  }];
}

function normalizeMoversArray(items = [], market) {
  return items.map((item, idx) => {
    const changePercentage = Number(String(item.change_percentage ?? item.changePct ?? item.change ?? item.percent_change ?? "0").replace(/[%,%]/g, ""));
    const price = Number(item.current_price ?? item.last_price ?? item.price ?? 0);

    return {
      id: item.ticker || item.symbol || `mover-${idx}`,
      ticker: item.ticker || item.symbol || `G-${idx}`,
      name: item.company || item.name || item.ticker || item.symbol || "Global stock",
      market,
      price,
      changePct: Number.isFinite(changePercentage) ? changePercentage : 0,
      currency: item.currency
    };
  });
}

function readMarketView() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const nextRegion = REGIONS.includes(params.get("region")) ? params.get("region") : "Africa";
  const nextTypes = getInstrumentTypes(nextRegion);
  const nextType = nextTypes.includes(params.get("type")) ? params.get("type") : "Stocks";
  const nextCountry = nextRegion === "Africa" && AFRICA_COUNTRIES.includes(params.get("country"))
    ? params.get("country")
    : nextRegion === "Africa" ? "Nigeria" : "All";
  const nextSort = SORTS.some((option) => option.value === params.get("sort")) ? params.get("sort") : "default";
  const nextPage = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const nextQuery = params.get("q") || "";
  return { region: nextRegion, country: nextCountry, type: nextType, sort: nextSort, page: nextPage, query: nextQuery };
}


export default function MarketsPage() {
  const { region, setRegion, getAllLiveStocks, stocksLoading } = useStore();
  const router = useRouter();
  const [country, setCountry] = useState("Nigeria");
  const [type, setType] = useState("Stocks");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const urlHydrated = useRef(false);

  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  const [commodities, setCommodities] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [ngCurrencies, setNgCurrencies] = useState([]);
  const [ngForexLoading, setNgForexLoading] = useState(false);
  const [etfs, setEtfs] = useState([]);
  const [mutualFunds, setMutualFunds] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  const [searchedStocks, setSearchedStocks] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [insightTab, setInsightTab] = useState("gainers");
  const [globalGainers, setGlobalGainers] = useState([]);
  const [globalLosers, setGlobalLosers] = useState([]);
  const [insightDir, setInsightDir] = useState("next");
  const [marketMoversLoading, setMarketMoversLoading] = useState(true);
  const [previewHistory, setPreviewHistory] = useState({});

  const insightIndex = INSIGHT_TABS.findIndex((t) => t.id === insightTab);
  const touchX = useRef(null);

  useEffect(() => {
    const savedView = readMarketView();
    if (savedView) {
      setRegion(savedView.region);
      setCountry(savedView.country);
      setType(savedView.type);
      setSort(savedView.sort);
      setPage(savedView.page);
      setQuery(savedView.query);
      setSubmittedQuery(savedView.query);
    }
    urlHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!urlHydrated.current || typeof window === "undefined") return;
    const params = new URLSearchParams();
    params.set("region", region);
    params.set("country", country);
    params.set("type", type);
    if (sort !== "default") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (submittedQuery) params.set("q", submittedQuery);
    const queryString = params.toString();
    window.history.replaceState(null, "", queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname);
  }, [region, country, type, sort, page, submittedQuery]);
  // Nigeria is the only African news source available, so Region: Africa always
  // means the NG feed regardless of the Country sub-choice.
  const isNg = region === "Africa";

  useEffect(() => {
    let cancelled = false;

    async function loadIndices() {
      setIndicesLoading(true);
      try {
        const raw = region === "Africa" ? await fetchNgIndices() : await fetchGlobalIndices();
        if (cancelled) return;
        setIndices(region === "Africa" ? mapNgIndices(raw) : mapGlobalIndices(raw));
      } catch (e) {
        if (!cancelled) setIndices([]);
      } finally {
        if (!cancelled) setIndicesLoading(false);
      }
    }

    loadIndices();
    return () => {
      cancelled = true;
    };
  }, [region]);

  useEffect(() => {
    let cancelled = false;

    async function loadMovers() {
      setMarketMoversLoading(true);
      setGlobalGainers([]);
      setGlobalLosers([]);

      const [moversResult] = await Promise.allSettled([
        isNg ? fetchNgMovers() : fetchGlobalMovers(),
      ]);

      if (cancelled) return;

      if (moversResult.status === "fulfilled") {
        const moversPayload = moversResult.value;
        setGlobalGainers(normalizeMoversArray(moversPayload?.top_gainers || [], isNg ? "NGX" : "Global"));
        setGlobalLosers(normalizeMoversArray(moversPayload?.top_losers || [], isNg ? "NGX" : "Global"));
      }
      setMarketMoversLoading(false);
    }

    loadMovers();
    return () => { cancelled = true; };
  }, [isNg]);

  useEffect(() => {
    let cancelled = false;

    async function loadGlobalData() {
      setGlobalLoading(true);
      const [commoditiesRes, cryptoRes, forexRes, etfsRes, mutualFundsRes] = await Promise.allSettled([
        fetchGlobalCommodities(),
        fetchGlobalCrypto(),
        fetchGlobalForex(),
        fetchGlobalEtfs(),
        fetchGlobalMutualFunds()
      ]);
      if (cancelled) return;

      setCommodities(commoditiesRes.status === "fulfilled" ? mapCommodities(commoditiesRes.value) : []);
      setCrypto(cryptoRes.status === "fulfilled" ? mapCrypto(cryptoRes.value) : []);
      setCurrencies(forexRes.status === "fulfilled" ? mapForex(forexRes.value) : []);
      setEtfs(etfsRes.status === "fulfilled" ? mapEtfs(etfsRes.value) : []);
      setMutualFunds(mutualFundsRes.status === "fulfilled" ? mapMutualFunds(mutualFundsRes.value) : []);
      setGlobalLoading(false);
    }

    loadGlobalData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runLiveSearch() {
      if (!submittedQuery || !isLiveSearchType(type, region)) {
        setSearchedStocks(null);
        return;
      }

      setSearchLoading(true);
      try {
        const quote = await fetchGlobalStock(submittedQuery);
        if (cancelled) return;
        setSearchedStocks(mapSearchedStock(quote));
      } catch (e) {
        if (!cancelled) setSearchedStocks([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }

    runLiveSearch();
    return () => {
      cancelled = true;
    };
  }, [submittedQuery, type, region]);

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
    if (!isNg) {
      setNgCurrencies([]);
      setNgForexLoading(false);
      return undefined;
    }
    setNgForexLoading(true);
    fetchNgForexRates()
      .then((payload) => { if (!cancelled) setNgCurrencies(mapNgForex(payload)); })
      .catch(() => { if (!cancelled) setNgCurrencies([]); })
      .finally(() => { if (!cancelled) setNgForexLoading(false); });
    return () => { cancelled = true; };
  }, [isNg]);

  const live = { indices, currencies, ngCurrencies, commodities, crypto, etfs, mutualFunds };
  const searched = { stocks: searchedStocks };

  const stocks = getAllLiveStocks();
  const types = getInstrumentTypes(region);
  const isIndex = type === "Indices";
  const clickable = type === "Stocks" || (type === "Indices" && region === "Africa") || (type === "Currencies" && region === "Africa");

  function getDetailHref(item) {
    const asset = item.assetType || "stock";
    const identifier = asset === "ng_forex" ? item.source : item.ticker;
    return `/stock/${encodeURIComponent(identifier)}?asset=${asset}`;
  }

  let items = getInstruments(region, type, stocks, live, searched, submittedQuery);
  const nameOf = (item) => (isIndex ? item.name : item.ticker);
  if (sort === "change_desc") items = [...items].sort((a, b) => b.changePct - a.changePct);
  else if (sort === "change_asc") items = [...items].sort((a, b) => a.changePct - b.changePct);
  else if (sort === "alpha") items = [...items].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!clickable || pageItems.length === 0) return undefined;
    let cancelled = false;
    const visibleItems = pageItems.filter((item) => item.assetType === "ng_index" || item.assetType === "ng_forex" || item.market === "NGX");
    Promise.all(visibleItems.map(async (item) => {
      try {
        const payload = item.assetType === "ng_index"
          ? await fetchNgIndexChart(item.ticker, { period: "30d" })
          : item.assetType === "ng_forex"
            ? await fetchNgForexChart(item.source, item.target, { period: "30d" })
            : await fetchNgCompanyChart(item.ticker, { period: "30d" });
        return [item.ticker, payload?.data || []];
      } catch (error) {
        return [item.ticker, []];
      }
    })).then((entries) => {
      if (cancelled) return;
      setPreviewHistory((current) => ({ ...current, ...Object.fromEntries(entries) }));
    });
    return () => { cancelled = true; };
  }, [clickable, type, region, currentPage, sort, submittedQuery, pageItems.length]);

  function handleRegionChange(v) {
    setRegion(v);
    setCountry(v === "Africa" ? "Nigeria" : "All");
    setType("Stocks");
    setPage(1);
    setQuery("");
    setSubmittedQuery("");
  }

  function handleTypeChange(v) {
    setType(v);
    setPage(1);
    setQuery("");
    setSubmittedQuery("");
  }

  function handleSortChange(v) {
    setSort(v);
    setPage(1);
  }

  function handleQueryChange(e) {
    if (e.target.value.length > 100) return; // prevent abuse
    setQuery(e.target.value);
    setPage(1);
  }

  function handleQueryKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSearch();
    }
  }

  function submitSearch() {
    if (query.trim() === submittedQuery) return;
    const nextQuery = query.trim();
    setPage(1);
    setSubmittedQuery(nextQuery);
  }

  const avgChange = items.length ? items.reduce((a, i) => a + i.changePct, 0) / items.length : 0;
  const best = items.length ? [...items].sort((a, b) => b.changePct - a.changePct)[0] : null;
  const worst = items.length ? [...items].sort((a, b) => a.changePct - b.changePct)[0] : null;
  const subOf = (item) => item.market || item.type || "";

  const typeLoading = {
    Indices: indicesLoading,
    Stocks: stocksLoading,
    Currencies: region === "Africa" ? ngForexLoading : globalLoading,
    Commodities: globalLoading,
    Cryptocurrency: globalLoading,
    ETFs: globalLoading,
    "Mutual Funds": globalLoading
  };
  const waitingOnSearch = isLiveSearchType(type, region) && Boolean(submittedQuery) && searchLoading;
  const showLoading = ((typeLoading[type] ?? false) || waitingOnSearch) && items.length === 0;

  // Use real API data, fall back to live stocks if needed
  const gainers = globalGainers.slice(0, 5)
  const losers = globalLosers.slice(0, 5)

  return (
    <>
      <PageFrame className={"iv-markets-page" + (type === "Stocks" ? " stock-layout" : "")}>

        <div className="iv-filter-bar iv-market-filter">
          <Select compact label="Region" value={region} onChange={handleRegionChange} options={REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" value={country} onChange={setCountry} options={AFRICA_COUNTRIES} />
          )}
          <Select compact label="Type" value={type} onChange={handleTypeChange} options={types} />
          <Select compact label="Sort" value={sort} onChange={handleSortChange} options={SORTS} />
          <div className="iv-search-box">
            <button type="button" className="iv-search-submit" onClick={submitSearch} aria-label="Search markets" title="Search markets">
              <Search size={14} />
            </button>
            <input
              type="text"
              className="iv-search-input"
              placeholder={`Search ${type.toLowerCase()}…`}
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleQueryKeyDown}
            />
          </div>
        </div>

        {/* Market insights \u2014 movers / gainers / losers / calendar as a swipeable 3D card carousel */}
        {type === "Stocks" && (
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

              </div>
            </div>

            <div className="iv-insight-dots">
              {INSIGHT_TABS.map((t, i) => (
                <button key={t.id} className={"iv-insight-dot" + (i === insightIndex ? " active" : "")} onClick={() => goToInsight(t.id)} aria-label={"Go to " + t.label} />
              ))}
            </div>
          </div>
        )}
        <div className="iv-panel iv-market-summary">
          <div className="iv-panel-head"><h3>{type === "Stocks" && region === "Africa" && country === "Nigeria" ? "Nigeria Stocks" : `${region === "Africa" && country !== "All" ? country : region} · ${type}`}</h3></div>
          <p className="iv-sub" style={{ marginBottom: 16 }}>
            {type} in {region === "Africa" && country !== "All" ? country : region} {avgChange >= 0 ? "are broadly higher" : "are broadly lower"} right now, averaging {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}% across {items.length} tracked instrument{items.length === 1 ? "" : "s"}.
          </p>
          <div className="iv-stat-strip small" style={{ margin: 0 }}>
            <div className="iv-stat">
              <div className="iv-stat-label">Average change</div>
              <div className={"iv-stat-value mono " + (avgChange >= 0 ? "iv-pos-text" : "iv-neg-text")}>{avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%</div>
            </div>
            {best && (
              <div className="iv-stat">
                <div className="iv-stat-label">Best performer</div>
                <div className="iv-stat-value mono iv-pos-text">{nameOf(best)} {best.changePct >= 0 ? "+" : ""}{best.changePct.toFixed(2)}%</div>
              </div>
            )}
            {worst && (
              <div className="iv-stat">
                <div className="iv-stat-label">Weakest performer</div>
                <div className="iv-stat-value mono iv-neg-text">{nameOf(worst)} {worst.changePct.toFixed(2)}%</div>
              </div>
            )}
            <div className="iv-stat">
              <div className="iv-stat-label">Tracked instruments</div>
              <div className="iv-stat-value mono">{items.length}</div>
            </div>
          </div>
        </div>


        <div className="iv-panel iv-market-list">
          <div className="iv-table-wrap">
            <table className="iv-table">
              <thead>
                <tr>
                  <th>{isIndex ? "Index" : "Instrument"}</th>
                  <th className="iv-col-hide-mobile">{isIndex ? "Region" : "Detail"}</th>
                  <th>{isIndex ? "Value" : "Price"}</th>
                  <th>Change</th>
                  <th className="iv-col-hide-mobile">Trend</th>
                </tr>
              </thead>
              <tbody>
                {!showLoading && pageItems.map((item) => (
                  <tr
                    key={isIndex ? item.name : item.ticker}
                    style={{ cursor: clickable ? "pointer" : "default" }}
                    onClick={() => { if (clickable) router.push(getDetailHref(item)); }}
                  >
                    <td>
                      {isIndex
                        ? item.name
                        : (<><span className="mono">{item.ticker}</span><span className="iv-sub"> {item.name}</span></>)}
                    </td>
                    <td className="iv-sub iv-col-hide-mobile">{isIndex ? item.region : subOf(item)}</td>
                    <td className="mono">{itemPrice(item, isIndex)}</td>
                    <td className={"iv-chg " + (item.changePct >= 0 ? "pos" : "neg")}>
                      {item.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {Math.abs(item.changePct).toFixed(2)}%
                    </td>
                    <td className="iv-col-hide-mobile">
                      {(previewHistory[item.ticker] || item.history || []).length > 1
                        ? <Sparkline data={previewHistory[item.ticker] || item.history} positive={item.changePct >= 0} />
                        : <span className="iv-sub">No preview</span>}
                    </td>
                  </tr>
                ))}
                {showLoading && (
                  <>
                    <SkeletonTableRow colCount={isIndex ? 4 : 5} />
                    <SkeletonTableRow colCount={isIndex ? 4 : 5} />
                    <SkeletonTableRow colCount={isIndex ? 4 : 5} />
                    <SkeletonTableRow colCount={isIndex ? 4 : 5} />
                  </>
                )}
                {!showLoading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="iv-empty-sm">
                      {query ? `No ${type.toLowerCase()} match "${query}".` : `No ${type.toLowerCase()} tracked for ${region} yet.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!showLoading && pageCount > 1 && (
            <nav className="iv-news-pagination" aria-label={`${type} pagination`}>
              <button className="iv-btn-ghost sm" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</button>
              <span className="iv-sub">Page {currentPage} of {pageCount}</span>
              <button className="iv-btn-ghost sm" type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>Next</button>
            </nav>
          )}
        </div>
      </PageFrame>
    </>
  );
}