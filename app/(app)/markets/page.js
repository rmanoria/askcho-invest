"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_INDICES, COMMODITIES, CRYPTO, CURRENCIES, BONDS, FUTURES } from "@/lib/markets";
import { formatMoney } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import Sparkline from "@/components/Sparkline";
import Select from "@/components/Select";

const REGIONS = ["Africa", "America", "Europe", "Asia", "Global"];
// countries available once "Africa" is picked as the region \u2014 add more as data is added for them
const AFRICA_COUNTRIES = ["All", "Nigeria"];
const SORTS = [
  { value: "default", label: "Default" },
  { value: "change_desc", label: "High to low" },
  { value: "change_asc", label: "Low to high" },
  { value: "alpha", label: "A\u2013Z" }
];

// which live market feed belongs to which region \u2014 the API only distinguishes
// NG (Africa) vs Global (everything else priced in USD), no NASDAQ/NYSE/ETF split.
const REGION_MARKETS = { Africa: ["NGX"], America: ["Global"] };

// instrument types available once a region is picked \u2014 geography-specific types first, then
// the globally-traded types (commodities, crypto, currencies, futures) which apply everywhere.
// add more entries to either list as data is added for them.
function getInstrumentTypes(region) {
  const types = [];
  if (region !== "Global") {
    types.push("Indices");
    if (REGION_MARKETS[region]) types.push("Stocks");
    if (["Africa", "America", "Europe"].includes(region)) types.push("Bonds");
  }
  types.push("Currencies", "Commodities", "Cryptocurrency", "Futures");
  return types;
}

function getInstruments(region, type, stocks) {
  if (type === "Indices") return ALL_INDICES.filter((ix) => ix.region === region);
  if (type === "Stocks") return stocks.filter((s) => (REGION_MARKETS[region] || []).includes(s.market));
  if (type === "Bonds") return BONDS.filter((b) => b.type === region);
  if (type === "Currencies") return region === "Africa" ? CURRENCIES.filter((c) => c.currency === "NGN") : CURRENCIES;
  if (type === "Commodities") return COMMODITIES;
  if (type === "Cryptocurrency") return CRYPTO;
  if (type === "Futures") return FUTURES;
  return [];
}

function itemPrice(item, isIndex) {
  if (isIndex) return item.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (item.currency === "%") return item.price.toFixed(2) + "%";
  return formatMoney(item.price, item.currency === "NGN" ? "NGN" : "USD");
}

export default function MarketsPage() {
  const { getAllLiveStocks, stocksLoading } = useStore();
  const router = useRouter();
  const [region, setRegion] = useState("Africa");
  const [country, setCountry] = useState("All");
  const [type, setType] = useState("Indices");
  const [sort, setSort] = useState("default");

  const stocks = getAllLiveStocks();
  const types = getInstrumentTypes(region);
  const isIndex = type === "Indices";
  const clickable = type === "Stocks";

  let items = getInstruments(region, type, stocks);
  const nameOf = (item) => (isIndex ? item.name : item.ticker);
  if (sort === "change_desc") items = [...items].sort((a, b) => b.changePct - a.changePct);
  else if (sort === "change_asc") items = [...items].sort((a, b) => a.changePct - b.changePct);
  else if (sort === "alpha") items = [...items].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  function handleRegionChange(v) {
    setRegion(v);
    setCountry("All");
    setType(getInstrumentTypes(v)[0]);
  }

  const avgChange = items.length ? items.reduce((a, i) => a + i.changePct, 0) / items.length : 0;
  const best = items.length ? [...items].sort((a, b) => b.changePct - a.changePct)[0] : null;
  const worst = items.length ? [...items].sort((a, b) => a.changePct - b.changePct)[0] : null;
  const subOf = (item) => item.market || item.type || "";
  const showLoading = type === "Stocks" && stocksLoading && items.length === 0;

  return (
    <>
      <Topbar />
      <TickerTape />
      <div className="iv-view">

        <div className="iv-filter-bar">
          <Select compact label="Region" shortLabel="Reg" value={region} onChange={handleRegionChange} options={REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" shortLabel="Ctry" value={country} onChange={setCountry} options={AFRICA_COUNTRIES} />
          )}
          <Select compact label="Type" shortLabel="Type" value={type} onChange={setType} options={types} />
          <Select compact label="Sort" shortLabel="Sort" value={sort} onChange={setSort} options={SORTS} />
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
                {items.map((item) => (
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
                {items.length === 0 && (
                  <tr><td colSpan={isIndex ? 4 : 5} className="iv-empty-sm">{showLoading ? "Loading live prices\u2026" : "No " + type.toLowerCase() + " tracked for " + region + " yet."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}