"use client";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Briefcase } from "lucide-react";
import { useStore } from "@/lib/store";
import { toNGN } from "@/lib/stocks";
import { formatNGN, formatMoney, formatShares } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import OrdersTable from "@/components/OrdersTable";

const COLORS = { NGX: "#ffffff", NYSE: "#8da2fb", NASDAQ: "#34d399", ETF: "#f4c463" };

export default function PortfolioPage() {
  const { state, getLiveStock, sell, cancelOrder } = useStore();
  const router = useRouter();

  const enriched = state.portfolio.map((h) => {
    const stock = getLiveStock(h.ticker);
    const currentNGN = toNGN(stock.price, stock.currency);
    const value = currentNGN * h.shares;
    const cost = h.avgCostNGN * h.shares;
    const gain = value - cost;
    const gainPct = cost ? (gain / cost) * 100 : 0;
    return { ...h, stock, currentNGN, value, cost, gain, gainPct };
  });
  const totalValue = enriched.reduce((a, h) => a + h.value, 0);
  const totalCost = enriched.reduce((a, h) => a + h.cost, 0);
  const totalGain = totalValue - totalCost;

  const byMarket = ["NGX", "NYSE", "NASDAQ", "ETF"]
    .map((m) => ({ name: m, value: enriched.filter((h) => h.stock.market === m).reduce((a, h) => a + h.value, 0) }))
    .filter((d) => d.value > 0);

  return (
    <>
      <Topbar title="Portfolio" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-stat-strip">
          <div className="iv-stat"><div className="iv-stat-label">Total value</div><div className="iv-stat-value mono">{formatNGN(totalValue + state.cash)}</div></div>
          <div className="iv-stat"><div className="iv-stat-label">Holdings value</div><div className="iv-stat-value mono">{formatNGN(totalValue)}</div></div>
          <div className="iv-stat"><div className="iv-stat-label">All-time gain</div><div className="iv-stat-value mono">{(totalGain >= 0 ? "+" : "") + formatNGN(totalGain)}</div></div>
          <div className="iv-stat"><div className="iv-stat-label">Cash available</div><div className="iv-stat-value mono">{formatNGN(state.cash)}</div></div>
        </div>

        {enriched.length === 0 ? (
          <div className="iv-panel iv-empty-state">
            <Briefcase size={28} className="muted" />
            <h3>Your portfolio is empty</h3>
            <p>Search for a stock and make your first investment to see it here.</p>
          </div>
        ) : (
          <div className="iv-grid-2">
            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Holdings</h3></div>
              <div className="iv-table-wrap"><table className="iv-table">
                <thead><tr><th>Stock</th><th>Shares</th><th>Avg cost</th><th>Price</th><th>Value</th><th>Gain</th><th /></tr></thead>
                <tbody>
                  {enriched.map((h) => (
                    <tr key={h.ticker}>
                      <td onClick={() => router.push("/stock/" + h.ticker)} style={{ cursor: "pointer" }}>
                        <span className="mono">{h.ticker}</span><span className="iv-sub"> {h.stock.market}</span>
                      </td>
                      <td className="mono">{formatShares(h.shares)}</td>
                      <td className="mono">{formatNGN(h.avgCostNGN)}</td>
                      <td className="mono">{formatMoney(h.stock.price, h.stock.currency)}</td>
                      <td className="mono">{formatNGN(h.value)}</td>
                      <td className={"iv-chg " + (h.gain >= 0 ? "pos" : "neg")}>{h.gain >= 0 ? "+" : ""}{h.gainPct.toFixed(1)}%</td>
                      <td><button className="iv-btn-ghost xs" onClick={() => sell(h.ticker, h.shares)}>Sell all</button></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Allocation by market</h3></div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byMarket} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} isAnimationActive={false}>
                    {byMarket.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatNGN(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="iv-legend">
                {byMarket.map((d) => (
                  <div key={d.name} className="iv-legend-row">
                    <span className="dot" style={{ background: COLORS[d.name] }} />
                    {d.name}
                    <span className="mono">{totalValue ? ((d.value / totalValue) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <OrdersTable orders={state.orders} onCancel={cancelOrder} limit={8} />
      </div>
    </>
  );
}
