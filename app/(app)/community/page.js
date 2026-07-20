"use client";
import { Users } from "lucide-react";
import { TOP_INVESTORS } from "@/lib/stocks";
import { useStore } from "@/lib/store";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function CommunityPage() {
  const { notify } = useStore();

  return (
    <>
      <Topbar title="Community" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel">
          <div className="iv-panel-head">
            <div>
              <div className="iv-eyebrow">TOP INVESTORS</div>
              <h3>See what other investors are holding</h3>
            </div>
            <Users size={16} className="muted" />
          </div>
          <p className="iv-sub" style={{ marginBottom: 8 }}>
            A light look at how other investors on the platform are positioned. Past returns don't guarantee future ones \u2014 use this to learn, not to copy blindly.
          </p>
          {TOP_INVESTORS.slice().sort((a, b) => b.returnPct - a.returnPct).map((u) => (
            <div key={u.id} className="iv-investor-card">
              <div className="iv-avatar">{u.name.split(" ").map((n) => n[0]).join("")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div>{u.name} <span className="iv-sub">{u.handle}</span></div>
                    <div className="iv-sub">{u.followers.toLocaleString()} followers &middot; {u.risk} risk</div>
                  </div>
                  <div className={"iv-chg " + (u.returnPct >= 0 ? "pos" : "neg")}>{u.returnPct >= 0 ? "+" : ""}{u.returnPct.toFixed(1)}% (12mo)</div>
                </div>
                <div className="iv-holdings-tags">
                  {u.topHoldings.map((h) => <span key={h} className="iv-holdings-tag">{h}</span>)}
                </div>
              </div>
              <button className="iv-btn-ghost sm" onClick={() => notify("Following " + u.name + " (demo)")}>Follow</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
