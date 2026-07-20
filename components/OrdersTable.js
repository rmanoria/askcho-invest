"use client";
import { getStock } from "@/lib/stocks";
import { formatMoney, formatShares, formatDateTime } from "@/lib/format";

export default function OrdersTable({ orders, onCancel, limit }) {
  const open = orders.filter((o) => o.status === "pending");
  const recent = limit ? orders.slice(0, limit) : orders;

  return (
    <div className="iv-panel">
      <div className="iv-panel-head"><h3>Orders</h3></div>
      {open.length > 0 && (
        <>
          <div className="iv-eyebrow">OPEN</div>
          <div className="iv-table-wrap"><table className="iv-table">
            <thead><tr><th>Stock</th><th>Side</th><th>Type</th><th>Shares</th><th>Limit</th><th /></tr></thead>
            <tbody>
              {open.map((o) => {
                const stock = getStock(o.ticker);
                return (
                  <tr key={o.id}>
                    <td className="mono">{o.ticker}</td>
                    <td className={"iv-chg " + (o.side === "buy" ? "pos" : "neg")}>{o.side}</td>
                    <td className="iv-sub">{o.orderType}</td>
                    <td className="mono">{formatShares(o.shares)}</td>
                    <td className="mono">{o.limitPrice ? formatMoney(o.limitPrice, stock.currency) : "\u2014"}</td>
                    <td><button className="iv-btn-ghost xs" onClick={() => onCancel(o.id)}>Cancel</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </>
      )}
      <div className="iv-eyebrow" style={{ marginTop: open.length ? 18 : 0 }}>HISTORY</div>
      {recent.length === 0 ? (
        <p className="iv-empty-sm">No orders yet.</p>
      ) : (
        <div className="iv-table-wrap"><table className="iv-table">
          <thead><tr><th>Stock</th><th>Side</th><th>Type</th><th>Shares</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.ticker}</td>
                <td className={"iv-chg " + (o.side === "buy" ? "pos" : "neg")}>{o.side}</td>
                <td className="iv-sub">{o.orderType}</td>
                <td className="mono">{formatShares(o.shares)}</td>
                <td className="iv-sub">{o.status}</td>
                <td className="iv-sub">{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
