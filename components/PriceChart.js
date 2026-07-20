"use client";
import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Brush } from "recharts";
import { formatMoney } from "@/lib/format";

function ChartTooltip({ active, payload, currency }) {
  if (!active || !payload || !payload.length) return null;
  return <div className="iv-chart-tip">{formatMoney(payload[0].value, currency || "NGN")}</div>;
}

export default function PriceChart({ history, positive, height = 240, currency }) {
  const [period, setPeriod] = useState("1M");
  const [hover, setHover] = useState(null);
  const slices = { "1W": 7, "1M": 30, "3M": 90, ALL: history.length };
  const data = history.slice(-slices[period]);
  const color = positive ? "#34d399" : "#fb7185";
  const gradId = "grad-" + color.replace("#", "");

  return (
    <div>
      <div className="iv-chart-head">
        <div className="iv-period-tabs">
          {Object.keys(slices).map((p) => (
            <button
              key={p}
              className={"iv-period-tab" + (period === p ? " active" : "")}
              onClick={() => { setPeriod(p); setHover(null); }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="iv-crosshair-readout mono">
          {hover ? formatMoney(hover.price, currency) : "Drag chart edges to zoom"}
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
