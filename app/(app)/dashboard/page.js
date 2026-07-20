"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, ChevronRight, Wallet, Star, Newspaper, BellRing, Repeat, Landmark } from "lucide-react";
import { useStore } from "@/lib/store";
import { toNGN, getMockNews } from "@/lib/stocks";
import { formatMoney, formatNGN } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import PriceChart from "@/components/PriceChart";
import Sparkline from "@/components/Sparkline";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";
import CountUp from "@/components/CountUp";

export default function DashboardPage() {
  const { state, getAllLiveStocks, getLiveIndexes } = useStore();
  const router = useRouter();
  const stocks = getAllLiveStocks();
  const indexes = getLiveIndexes();

  const enriched = state.portfolio.map((h) => {
    const s = stocks.find((x) => x.ticker === h.ticker);
    const currentNGN = toNGN(s.price, s.currency);
    const value = currentNGN * h.shares;
    const cost = h.avgCostNGN * h.shares;
    return { ...h, value, gain: value - cost };
  });
  const totalValue = enriched.reduce((a, h) => a + h.value, 0);
  const totalGain = enriched.reduce((a, h) => a + h.gain, 0);
  const grand = totalValue + state.cash;

  const sorted = [...stocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const movers = sorted.slice(0, 5);
  const spotlight = sorted[0];
  const watched = stocks.filter((s) => state.watchlist.includes(s.ticker)).slice(0, 4);

  const newsSources = [spotlight, ...movers.slice(1, 3)];
  const marketNews = newsSources
    .flatMap((s) => getMockNews(s.ticker).slice(0, 1).map((n) => ({ ...n, ticker: s.ticker })))
    .sort((a, b) => a.hoursAgo - b.hoursAgo)
    .slice(0, 3);

  return (
    <>
      <Topbar title="Dashboard" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-stat-strip index">
          {indexes.map((ix) => (
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

        <div className="iv-grid-2">
          <div className="iv-col-stack">
            <div className="iv-panel">
              <div className="iv-panel-head">
                <div>
                  <div className="iv-eyebrow">SPOTLIGHT</div>
                  <h3>{spotlight.name} <span className="mono muted">{spotlight.ticker}</span></h3>
                </div>
                <Link href={"/stock/" + spotlight.ticker} className="iv-btn-ghost sm">View details <ChevronRight size={14} /></Link>
              </div>
              <div className="iv-price-row">
                <span className="iv-price mono"><FlashValue value={spotlight.price} render={() => formatMoney(spotlight.price, spotlight.currency)} /></span>
                <span className={"iv-chg " + (spotlight.changePct >= 0 ? "pos" : "neg")}>
                  {spotlight.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(spotlight.changePct).toFixed(2)}%
                </span>
              </div>
              <PriceChart history={spotlight.history} positive={spotlight.changePct >= 0} currency={spotlight.currency} height={220} />
            </div>

            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Market news</h3><Newspaper size={16} className="muted" /></div>
              <div className="iv-notif-list">
                {marketNews.map((n) => (
                  <div key={n.id} className="iv-notif-item" style={{ cursor: "pointer" }} onClick={() => router.push("/stock/" + n.ticker)}>
                    <div><span className="mono muted" style={{ marginRight: 6 }}>{n.ticker}</span>{n.headline}</div>
                    <div className="iv-sub">{n.source} &middot; {n.hoursAgo}h ago</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="iv-col-stack">
            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Portfolio</h3><Wallet size={16} className="muted" /></div>
              <div className="iv-portfolio-total mono"><CountUp value={grand} format={(v) => formatNGN(v)} /></div>
              <div className={"iv-chg " + (totalGain >= 0 ? "pos" : "neg")}>
                {totalGain >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {formatNGN(Math.abs(totalGain))} all time
              </div>
              <div className="iv-mini-row"><span>Cash available</span><span className="mono">{formatNGN(state.cash)}</span></div>
              <Link href="/portfolio" className="iv-btn-ghost sm full">View portfolio <ChevronRight size={14} /></Link>
            </div>
            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Watchlist</h3><Star size={16} className="muted" /></div>
              {watched.length === 0 ? (
                <p className="iv-empty-sm">No stocks watched yet.</p>
              ) : (
                <div className="iv-watch-mini">
                  {watched.map((s) => (
                    <div key={s.ticker} className="iv-watch-mini-row" onClick={() => router.push("/stock/" + s.ticker)}>
                      <div>
                        <div className="mono">{s.ticker}</div>
                        <div className="iv-sub">{s.market}</div>
                      </div>
                      <Sparkline data={s.history.slice(-20)} positive={s.changePct >= 0} />
                      <span className={"iv-chg sm " + (s.changePct >= 0 ? "pos" : "neg")}>
                        {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/watchlist" className="iv-btn-ghost sm full">View watchlist <ChevronRight size={14} /></Link>
            </div>

            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Quick actions</h3></div>
              <div className="iv-quick-actions">
                <Link href="/wallet" className="iv-quick-action">
                  <Wallet size={16} />
                  <span>Add funds</span>
                </Link>
                <Link href="/alerts" className="iv-quick-action">
                  <BellRing size={16} />
                  <span>Set alert</span>
                </Link>
                <Link href="/auto-invest" className="iv-quick-action">
                  <Repeat size={16} />
                  <span>Auto-invest</span>
                </Link>
                <Link href="/fixed-income" className="iv-quick-action">
                  <Landmark size={16} />
                  <span>Fixed income</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Today's movers</h3></div>
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
