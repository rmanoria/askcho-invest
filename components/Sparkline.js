"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ data, positive, width = 90, height = 32 }) {
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="price" stroke={positive ? "#34d399" : "#fb7185"} strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
