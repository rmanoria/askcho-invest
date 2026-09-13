"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import TrendIndicator from "@/components/TrendIndicator";
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
  fetchGlobalStock
} from "@/lib/api";
// NOTE: adjust the "@/lib/api" import above if your service layer file
// lives at a different path (e.g. "@/lib/cam-api").

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
    const base = region === "Africa" ? live.currencies.filter((c) => c.ticker?.includes("NGN")) : live.currencies;
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
    changePct: Number(item.percent_change ?? item.changePct ?? item.PercChange ?? 0),
    region: "Africa"
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

export default function MarketsPage() {
  const { region, setRegion, getAllLiveStocks, stocksLoading } = useStore();
  const router = useRouter();
  const [country, setCountry] = useState("Nigeria");
  const [type, setType] = useState("Indices");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  const [commodities, setCommodities] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [etfs, setEtfs] = useState([]);
  const [mutualFunds, setMutualFunds] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  const [searchedStocks, setSearchedStocks] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

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

  const live = { indices, currencies, commodities, crypto, etfs, mutualFunds };
  const searched = { stocks: searchedStocks };

  const stocks = getAllLiveStocks();
  const types = getInstrumentTypes(region);
  const isIndex = type === "Indices";
  const clickable = type === "Stocks";

  let items = getInstruments(region, type, stocks, live, searched, submittedQuery);
  const nameOf = (item) => (isIndex ? item.name : item.ticker);
  if (sort === "change_desc") items = [...items].sort((a, b) => b.changePct - a.changePct);
  else if (sort === "change_asc") items = [...items].sort((a, b) => a.changePct - b.changePct);
  else if (sort === "alpha") items = [...items].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleRegionChange(v) {
    setRegion(v);
    setCountry(v === "Africa" ? "Nigeria" : "All");
    setType(getInstrumentTypes(v)[0]);
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
    Currencies: globalLoading,
    Commodities: globalLoading,
    Cryptocurrency: globalLoading,
    ETFs: globalLoading,
    "Mutual Funds": globalLoading
  };
  const waitingOnSearch = isLiveSearchType(type, region) && Boolean(submittedQuery) && searchLoading;
  const showLoading = ((typeLoading[type] ?? false) || waitingOnSearch) && items.length === 0;

  return (
    <>
      <PageFrame>

        <div className="iv-filter-bar">
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

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>{region === "Africa" && country !== "All" ? country : region} &middot; {type}</h3></div>
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

        <div className="iv-panel">
          <div className="iv-table-wrap">
            <table className="iv-table">
              <thead>
                <tr>
                  <th>{isIndex ? "Index" : "Instrument"}</th>
                  <th className="iv-col-hide-mobile">{isIndex ? "Region" : "Detail"}</th>
                  <th>{isIndex ? "Value" : "Price"}</th>
                  <th>Change</th>
                  {!isIndex && <th className="iv-col-hide-mobile">Trend</th>}
                </tr>
              </thead>
              <tbody>
                {!showLoading && pageItems.map((item) => (
                  <tr
                    key={isIndex ? item.name : item.ticker}
                    style={{ cursor: clickable ? "pointer" : "default" }}
                    onClick={() => { if (clickable) router.push("/stock/" + item.ticker); }}
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
                    {!isIndex && <td className="iv-col-hide-mobile"><TrendIndicator changePct={item.changePct} /></td>}
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
                    <td colSpan={isIndex ? 4 : 5} className="iv-empty-sm">
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