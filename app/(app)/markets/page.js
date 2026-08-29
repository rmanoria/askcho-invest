"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { BONDS, FUTURES } from "@/lib/markets";
import { formatMoney } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import Sparkline from "@/components/Sparkline";
import Select from "@/components/Select";
import SkeletonTableRow from "@/components/SkeletonTableRow";
import {
  fetchNgIndices,
  fetchGlobalIndices,
  fetchGlobalCommodities,
  fetchGlobalCrypto,
  fetchGlobalForex,
  fetchGlobalEtfs,
  fetchGlobalMutualFunds
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

// which live market feed belongs to which region — the API only distinguishes
// NG (Africa) vs Global (everything else priced in USD), no NASDAQ/NYSE/ETF split.
const REGION_MARKETS = { Africa: ["NGX"], America: ["Global"] };

// instrument types available once a region is picked — Indices is always
// available (Africa uses /market/ng/indices, Global uses /market/global/indices
// via ETF proxies). Region-specific types come next, then the globally-traded
// types (commodities, crypto, currencies, ETFs, mutual funds, futures), which
// are the same regardless of region.
function getInstrumentTypes(region) {
  const types = ["Indices"];
  if (REGION_MARKETS[region]) types.push("Stocks");
  if (["Africa", "America", "Europe"].includes(region)) types.push("Bonds");
  types.push("Currencies", "Commodities", "Cryptocurrency", "ETFs", "Mutual Funds", "Futures");
  return types;
}

function getInstruments(region, type, stocks, live) {
  if (type === "Indices") return live.indices;
  if (type === "Stocks") return stocks.filter((s) => (REGION_MARKETS[region] || []).includes(s.market));
  if (type === "Bonds") return BONDS.filter((b) => b.type === region);
  if (type === "Currencies") {
    // forex pairs are fetched globally (not region-scoped), but Africa
    // narrows the view down to NGN pairs the same way the old static
    // CURRENCIES list did.
    return region === "Africa" ? live.currencies.filter((c) => c.ticker?.includes("NGN")) : live.currencies;
  }
  if (type === "Commodities") return live.commodities;
  if (type === "Cryptocurrency") return live.crypto;
  if (type === "ETFs") return live.etfs;
  if (type === "Mutual Funds") return live.mutualFunds;
  if (type === "Futures") return FUTURES;
  return [];
}

function itemPrice(item, isIndex) {
  if (isIndex) return Number(item.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (item.currency === "%") return Number(item.price ?? 0).toFixed(2) + "%";
  // forex rates aren't "money" in a currency sense - show the raw rate instead
  if (item.currency === "rate") return Number(item.price ?? 0).toFixed(4);
  return formatMoney(item.price, item.currency === "NGN" ? "NGN" : "USD");
}

// --- Mapping helpers: backend response shape -> the row shape this page renders

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

// NG indices come from NGN_MARKET_API_URL, whose exact field names weren't
// specified when this was wired up - these fallbacks cover the likely
// shapes, but confirm against a real response and trim/adjust as needed.
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
      // Alpha Vantage's CURRENCY_EXCHANGE_RATE is a point-in-time rate with
      // no daily-change field, so this stays 0 until/unless that changes.
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
      // Finnhub's quote endpoint only returns price data, not the fund's
      // full name, so ticker doubles as the display name here.
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

export default function MarketsPage() {
  const { getAllLiveStocks, stocksLoading } = useStore();
  const router = useRouter();
  const [region, setRegion] = useState("Africa");
  const [country, setCountry] = useState("Nigeria");
  const [type, setType] = useState("Indices");
  const [sort, setSort] = useState("default");

  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  const [commodities, setCommodities] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [etfs, setEtfs] = useState([]);
  const [mutualFunds, setMutualFunds] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  // Indices depend on region (NG vs Global uses a different endpoint), so
  // they get their own effect keyed on `region`.
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

  // Everything else here is fetched globally regardless of region, so it
  // only needs to load once on mount.
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

  const live = { indices, currencies, commodities, crypto, etfs, mutualFunds };

  const stocks = getAllLiveStocks();
  const types = getInstrumentTypes(region);
  const isIndex = type === "Indices";
  const clickable = type === "Stocks";

  let items = getInstruments(region, type, stocks, live);
  const nameOf = (item) => (isIndex ? item.name : item.ticker);
  if (sort === "change_desc") items = [...items].sort((a, b) => b.changePct - a.changePct);
  else if (sort === "change_asc") items = [...items].sort((a, b) => a.changePct - b.changePct);
  else if (sort === "alpha") items = [...items].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  function handleRegionChange(v) {
    setRegion(v);
    setCountry(v === "Africa" ? "Nigeria" : "All");
    setType(getInstrumentTypes(v)[0]);
  }

  const avgChange = items.length ? items.reduce((a, i) => a + i.changePct, 0) / items.length : 0;
  const best = items.length ? [...items].sort((a, b) => b.changePct - a.changePct)[0] : null;
  const worst = items.length ? [...items].sort((a, b) => a.changePct - b.changePct)[0] : null;
  const subOf = (item) => item.market || item.type || "";

  const typeLoading = {
    Indices: indicesLoading,
    Stocks: stocksLoading,
    Bonds: false,
    Currencies: globalLoading,
    Commodities: globalLoading,
    Cryptocurrency: globalLoading,
    ETFs: globalLoading,
    "Mutual Funds": globalLoading,
    Futures: false
  };
  const showLoading = (typeLoading[type] ?? false) && items.length === 0;

  return (
    <>
      <PageFrame>

        <div className="iv-filter-bar">
          <Select compact label="Region" value={region} onChange={handleRegionChange} options={REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" value={country} onChange={setCountry} options={AFRICA_COUNTRIES} />
          )}
          <Select compact label="Type" value={type} onChange={setType} options={types} />
          <Select compact label="Sort" value={sort} onChange={setSort} options={SORTS} />
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
                {!showLoading && items.map((item) => (
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
                    {!isIndex && <td className="iv-col-hide-mobile">{item.history && <Sparkline data={item.history.slice(-20)} positive={item.changePct >= 0} />}</td>}
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
                {!showLoading && items.length === 0 && (
                  <tr><td colSpan={isIndex ? 4 : 5} className="iv-empty-sm">No {type.toLowerCase()} tracked for {region} yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageFrame>
    </>
  );
}