"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Star, Newspaper, LineChart, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { MARKETS } from "@/lib/stocks";
import { ALL_INDICES } from "@/lib/markets";
import { getGlobalNews, hoursAgo } from "@/lib/news";
import { formatMoney } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import MarketBadge from "@/components/MarketBadge";
import Sparkline from "@/components/Sparkline";
import FlashValue from "@/components/FlashValue";
import { useAuthGate } from "@/components/AuthGate";

export default function SearchPage() {
  const { state, getAllLiveStocks, toggleWatch } = useStore();
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [market, setMarket] = useState("ALL");
  const [news, setNews] = useState([]);
  const stocks = getAllLiveStocks();
  const needle = q.trim().toLowerCase();

  // Real news has no search endpoint, so we search within the general category feed.
  useEffect(() => {
    getGlobalNews("general").then(setNews).catch(() => setNews([]));
  }, []);

  const filtered = stocks.filter((s) => {
    const matchesMarket = market === "ALL" || s.market === market;
    const matchesQ = !needle || s.ticker.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle) || s.sector.toLowerCase().includes(needle);
    return matchesMarket && matchesQ;
  });

  const indexMatches = needle ? ALL_INDICES.filter((ix) => ix.name.toLowerCase().includes(needle)).slice(0, 6) : [];
  const newsMatches = needle
    ? news.filter((n) => n.headline.toLowerCase().includes(needle) || n.source.toLowerCase().includes(needle)).slice(0, 6)
    : [];

  return (
    <>
      <PageFrame>
        <div className="iv-search-bar">
          <SearchIcon size={16} className="muted" />
          <input placeholder="Search markets, indices, tickers and more..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="iv-filter-pills">
          {["ALL", ...MARKETS].map((m) => (
            <button key={m} className={"iv-filter-pill" + (market === m ? " active" : "")} onClick={() => setMarket(m)}>{m}</button>
          ))}
        </div>

        {needle && indexMatches.length > 0 && (
          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Indices</h3><LineChart size={16} className="muted" /></div>
            <div className="iv-table-wrap"><table className="iv-table">
              <thead><tr><th>Index</th><th>Value</th><th>Change</th></tr></thead>
              <tbody>
                {indexMatches.map((ix) => (
                  <tr key={ix.name} onClick={() => router.push("/markets")} style={{ cursor: "pointer" }}>
                    <td>{ix.name}</td>
                    <td className="mono">{ix.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className={"iv-chg " + (ix.changePct >= 0 ? "pos" : "neg")}>{ix.changePct >= 0 ? "+" : ""}{ix.changePct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {needle && newsMatches.length > 0 && (
          <div className="iv-panel">
            <div className="iv-panel-head"><h3>News</h3><Newspaper size={16} className="muted" /></div>
            <div className="iv-news-list">
              {newsMatches.map((n) => (
                <a key={n.id} className="iv-news-row" href={n.url}>
                  {n.image && <div className="iv-news-thumb" style={{ backgroundImage: "url(" + n.image + ")" }} />}
                  <div className="iv-news-row-body">
                    <div className="iv-news-headline">{n.headline}</div>
                    <div className="iv-sub">{n.source} &middot; {hoursAgo(n.datetime)}h ago</div>
                  </div>
                  <ExternalLink size={14} className="muted" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="iv-panel">
          {needle && <div className="iv-panel-head"><h3>Stocks</h3></div>}
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
                      <button className="iv-star-btn" onClick={() => requireAuth(() => toggleWatch(s.ticker))} aria-label="Toggle watchlist">
                        <Star size={15} fill={watched ? "#ffffff" : "none"} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && indexMatches.length === 0 && newsMatches.length === 0 && (
                <tr><td colSpan={7} className="iv-empty-sm">No results match your search.</td></tr>
              )}
            </tbody>
          </table></div>
        </div>
      </PageFrame>
    </>
  );
}