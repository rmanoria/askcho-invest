"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, ChevronRight, Newspaper, TrendingDown, TrendingUp, CalendarDays } from "lucide-react";
import { useStore } from "@/lib/store";
import { getMockNews } from "@/lib/stocks";
import { ALL_INDICES, getCalendarEvents } from "@/lib/markets";
import { formatMoney, formatDate } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";

export default function DashboardPage() {
  const { getAllLiveStocks, getLiveIndexes } = useStore();
  const router = useRouter();
  const stocks = getAllLiveStocks();
  const indexes = getLiveIndexes();
  const summaryIndexes = [...indexes, ...ALL_INDICES.slice(3, 6)];

  const sortedByChange = [...stocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const movers = sortedByChange.slice(0, 6);

  const newsSources = sortedByChange.slice(0, 3);
  const newsPreview = newsSources
    .flatMap((s) => getMockNews(s.ticker).slice(0, 1).map((n) => ({ ...n, ticker: s.ticker })))
    .slice(0, 4);

  const equities = stocks.filter((s) => s.market !== "ETF");
  const undervalued = [...equities].sort((a, b) => a.peRatio - b.peRatio).slice(0, 5);
  const overvalued = [...equities].sort((a, b) => b.peRatio - a.peRatio).slice(0, 5);

  const events = getCalendarEvents().slice(0, 6);

  return (
    <>
      <Topbar title="Home" />
      <TickerTape />
      <div className="iv-view">

        {/* News */}
        <div className="iv-panel">
          <div className="iv-panel-head">
            <h3>News</h3>
            <Link href="/news" className="iv-btn-ghost sm">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="iv-notif-list">
            {newsPreview.map((n) => (
              <div key={n.id} className="iv-notif-item" style={{ cursor: "pointer" }} onClick={() => router.push("/stock/" + n.ticker)}>
                <div><span className="mono muted" style={{ marginRight: 6 }}>{n.ticker}</span>{n.headline}</div>
                <div className="iv-sub">{n.source} &middot; {n.hoursAgo}h ago</div>
              </div>
            ))}
          </div>
        </div>

        {/* Markets summary */}
        <div className="iv-panel">
          <div className="iv-panel-head">
            <h3>Markets summary</h3>
            <Link href="/markets" className="iv-btn-ghost sm">All markets <ChevronRight size={14} /></Link>
          </div>
          <div className="iv-stat-strip index" style={{ marginBottom: 0 }}>
            {summaryIndexes.map((ix) => (
              <div key={ix.name} className="iv-stat">
                <div className="iv-stat-label">{ix.name}</div>
                <div className="iv-stat-value mono"><FlashValue value={ix.value} render={() => ix.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} /></div>
                <div className={"iv-chg " + (ix.changePct >= 0 ? "pos" : "neg")}>
                  {ix.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(ix.changePct).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most undervalued / overvalued */}
        <div className="iv-grid-2">
          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Most undervalued</h3><TrendingDown size={16} className="muted" /></div>
            <table className="iv-table">
              <thead><tr><th>Stock</th><th>P/E</th><th>Price</th></tr></thead>
              <tbody>
                {undervalued.map((s) => (
                  <tr key={s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                    <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                    <td className="mono iv-pos-text">{s.peRatio}</td>
                    <td className="mono">{formatMoney(s.price, s.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Most overvalued</h3><TrendingUp size={16} className="muted" /></div>
            <table className="iv-table">
              <thead><tr><th>Stock</th><th>P/E</th><th>Price</th></tr></thead>
              <tbody>
                {overvalued.map((s) => (
                  <tr key={s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                    <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                    <td className="mono iv-neg-text">{s.peRatio}</td>
                    <td className="mono">{formatMoney(s.price, s.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar */}
        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Calendar</h3><CalendarDays size={16} className="muted" /></div>
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
        </div>

        {/* Top movers */}
        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Top movers</h3><Newspaper size={16} className="muted" style={{ visibility: "hidden" }} /></div>
          <div className="iv-table-wrap"><table className="iv-table">
            <thead><tr><th>Stock</th><th>Market</th><th>Price</th><th>Change</th><th /></tr></thead>
            <tbody>
              {movers.map((s) => (
                <tr key={s.ticker} onClick={() => router.push("/stock/" + s.ticker)} style={{ cursor: "pointer" }}>
                  <td><span className="mono">{s.ticker}</span><span className="iv-sub"> {s.name}</span></td>
                  <td><MarketBadge market={s.market} /></td>
                  <td className="mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></td>
                  <td className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                    {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                  </td>
                  <td><ChevronRight size={14} className="muted" /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>

      </div>
    </>
  );
}
