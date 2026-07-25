"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { MARKETS } from "@/lib/stocks";
import { formatMoney } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import MarketBadge from "@/components/MarketBadge";
import Sparkline from "@/components/Sparkline";
import FlashValue from "@/components/FlashValue";

export default function SearchPage() {
  const { state, getAllLiveStocks, toggleWatch } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [market, setMarket] = useState("ALL");
  const stocks = getAllLiveStocks();

  const filtered = stocks.filter((s) => {
    const matchesMarket = market === "ALL" || s.market === market;
    const needle = q.toLowerCase();
    const matchesQ = !q || s.ticker.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle) || s.sector.toLowerCase().includes(needle);
    return matchesMarket && matchesQ;
  });

  return (
    <>
      <Topbar />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-search-bar">
          <SearchIcon size={16} className="muted" />
          <input placeholder="Search by ticker, company, or sector..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="iv-filter-pills">
          {["ALL", ...MARKETS].map((m) => (
            <button key={m} className={"iv-filter-pill" + (market === m ? " active" : "")} onClick={() => setMarket(m)}>{m}</button>
          ))}
        </div>
        <div className="iv-panel">
          <div className="iv-table-wrap"><table className="iv-table">
            <thead><tr><th>Stock</th><th className="iv-col-hide-mobile">Market</th><th className="iv-col-hide-mobile">Sector</th><th>Price</th><th>Change</th><th className="iv-col-hide-mobile">Trend</th><th /></tr></thead>
            <tbody>
              {filtered.map((s) => {
                const watched = state.watchlist.includes(s.ticker);
                return (
                  <tr key={s.ticker}>
                    <td onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                      <div className="mono">{s.ticker}</div><div className="iv-sub">{s.name}</div>
                    </td>
                    <td className="iv-col-hide-mobile"><MarketBadge market={s.market} /></td>
                    <td className="iv-sub iv-col-hide-mobile">{s.sector}</td>
                    <td className="mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></td>
                    <td className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </td>
                    <td className="iv-col-hide-mobile"><Sparkline data={s.history.slice(-14)} positive={s.changePct >= 0} /></td>
                    <td>
                      <button className="iv-star-btn" onClick={() => toggleWatch(s.ticker)} aria-label="Toggle watchlist">
                        <Star size={15} fill={watched ? "#ffffff" : "none"} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="iv-empty-sm">No stocks match your search.</td></tr>
              )}
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  );
}