"use client";
import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Brush } from "recharts";
import { formatDate, formatMoney } from "@/lib/format";

function ChartTooltip({ active, payload, currency }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="iv-chart-tip">
      <div className="iv-chart-tip-date">{formatDate(point.timestamp)}</div>
      <div>{formatMoney(point.price, currency || "NGN")}</div>
    </div>
  );
}

const PERIODS = [
  { label: "1W", value: "7d" },
  { label: "1M", value: "30d" },
  { label: "3M", value: "90d" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
  { label: "ALL", value: "all" }
];

export default function PriceChart({ history, positive, height = 240, currency, loading, error, period = "30d", onPeriodChange }) {
  const [hover, setHover] = useState(null);
  if (loading && (!history || history.length === 0)) return <p className="iv-empty-sm">Loading price history...</p>;
  if (error && (!history || history.length === 0)) return <p className="iv-empty-sm">Price history is unavailable right now.</p>;
  if (!history || history.length === 0) return <p className="iv-empty-sm">Historical prices are not available yet.</p>;
  const data = history;
  const color = positive ? "#34d399" : "#fb7185";
  const gradId = "grad-" + color.replace("#", "");

  return (
    <div>
      <div className="iv-chart-head">
        <div className="iv-period-tabs">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              className={"iv-period-tab" + (period === value ? " active" : "")}
              onClick={() => { setHover(null); onPeriodChange?.(value); }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="iv-crosshair-readout mono">
          {hover ? formatDate(hover.timestamp) + " · " + formatMoney(hover.price, currency) : loading ? "Updating history..." : "Drag chart edges to zoom"}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          onMouseMove={(e) => { if (e && e.activePayload && e.activePayload.length) setHover(e.activePayload[0].payload); }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1c1c22" vertical={false} />
          <XAxis dataKey="i" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip content={(props) => <ChartTooltip {...props} currency={currency} />} cursor={{ stroke: "#3d3d46", strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="price" stroke={color} fill={"url(#" + gradId + ")"} strokeWidth={2} isAnimationActive={false} />
          {data.length > 8 && (
            <Brush dataKey="i" height={20} stroke={color} fill="#111115" travellerWidth={7} tickFormatter={() => ""} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
