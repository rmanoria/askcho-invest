"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { MARKET_CATEGORIES, ALL_INDICES, COMMODITIES, CRYPTO, CURRENCIES, BONDS, FUTURES } from "@/lib/markets";
import { formatMoney } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import Sparkline from "@/components/Sparkline";

function itemPrice(item, isIndex) {
  if (isIndex) return item.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (item.currency === "%") return item.price.toFixed(2) + "%";
  return formatMoney(item.price, item.currency === "NGN" ? "NGN" : "USD");
}

export default function MarketsPage() {
  const { getAllLiveStocks } = useStore();
  const router = useRouter();
  const [category, setCategory] = useState("indices");
  const [typeFilter, setTypeFilter] = useState("All");

  const stocks = getAllLiveStocks();
  const isIndex = category === "indices";
  const clickable = category === "stocks" || category === "funds";

  let items = [];
  if (category === "indices") items = ALL_INDICES;
  else if (category === "stocks") items = stocks.filter((s) => s.market !== "ETF");
  else if (category === "funds") items = stocks.filter((s) => s.market === "ETF");
  else if (category === "commodities") items = COMMODITIES;
  else if (category === "crypto") items = CRYPTO;
  else if (category === "currencies") items = CURRENCIES;
  else if (category === "bonds") items = BONDS;
  else if (category === "futures") items = FUTURES;

  const typeField = isIndex ? "region" : category === "stocks" ? "market" : category === "funds" ? "sector" : "type";
  const typeLabel = typeField === "market" ? "Market" : typeField === "region" ? "Region" : typeField === "sector" ? "Sector" : "Type";
  const types = ["All", ...Array.from(new Set(items.map((i) => i[typeField])))];
  const filtered = typeFilter === "All" ? items : items.filter((i) => i[typeField] === typeFilter);

  function handleCategoryChange(id) {
    setCategory(id);
    setTypeFilter("All");
  }

  return (
    <>
      <Topbar title="Markets" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-filter-pills">
          {MARKET_CATEGORIES.map((c) => (
            <button key={c.id} className={"iv-filter-pill" + (category === c.id ? " active" : "")} onClick={() => handleCategoryChange(c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="iv-form-row" style={{ marginBottom: 6 }}>
          <label className="iv-field" style={{ maxWidth: 240 }}>
            <span>{typeLabel}</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="iv-panel">
          <div className="iv-table-wrap">
            <table className="iv-table">
              <thead>
                <tr>
                  <th>{isIndex ? "Index" : "Instrument"}</th>
                  <th>{typeLabel}</th>
                  <th>{isIndex ? "Value" : "Price"}</th>
                  <th>Change</th>
                  {!isIndex && <th>Trend</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
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
                    <td className="iv-sub">{item[typeField]}</td>
                    <td className="mono">{itemPrice(item, isIndex)}</td>
                    <td className={"iv-chg " + (item.changePct >= 0 ? "pos" : "neg")}>
                      {item.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {Math.abs(item.changePct).toFixed(2)}%
                    </td>
                    {!isIndex && <td>{item.history && <Sparkline data={item.history.slice(-20)} positive={item.changePct >= 0} />}</td>}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={isIndex ? 4 : 5} className="iv-empty-sm">No instruments in this category.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
