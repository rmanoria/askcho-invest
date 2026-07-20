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
      <Topbar title="Search" />
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
            <thead><tr><th>Stock</th><th>Market</th><th>Sector</th><th>Price</th><th>Change</th><th>Trend</th><th /></tr></thead>
            <tbody>
              {filtered.map((s) => {
                const watched = state.watchlist.includes(s.ticker);
                return (
                  <tr key={s.ticker}>
                    <td onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                      <span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span>
                    </td>
                    <td><MarketBadge market={s.market} /></td>
                    <td className="iv-sub">{s.sector}</td>
                    <td className="mono">{formatMoney(s.price, s.currency)}</td>
                    <td className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </td>
                    <td><Sparkline data={s.history.slice(-14)} positive={s.changePct >= 0} /></td>
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
