"use client";
import { useState } from "react";
import { Info } from "lucide-react";

export default function Stat({ label, value, info }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="iv-stat">
      <div className="iv-stat-top">
        <span className="iv-stat-label">{label}</span>
        {info && (
          <button className="iv-info-btn" onClick={() => setOpen((o) => !o)} aria-label={"About " + label}>
            <Info size={12} />
          </button>
        )}
      </div>
      <div className="iv-stat-value mono">{value}</div>
      {open && <div className="iv-tooltip">{info}</div>}
    </div>
  );
}
