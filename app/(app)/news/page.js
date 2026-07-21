"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAllNews } from "@/lib/news";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import MarketBadge from "@/components/MarketBadge";

const TABS = [
  { id: "featured", label: "Featured" },
  { id: "breaking", label: "Breaking" },
  { id: "ngx", label: "NGX" },
  { id: "global", label: "Global" }
];

export default function NewsPage() {
  const [tab, setTab] = useState("featured");
  const router = useRouter();
  const all = getAllNews();

  const filtered =
    tab === "featured" ? all :
    tab === "breaking" ? all.filter((n) => n.breaking) :
    all.filter((n) => n.category === tab);

  const [hero, ...rest] = filtered.length ? filtered : all;
  const breakingCount = all.filter((n) => n.breaking).length;

  return (
    <>
      <Topbar title="News" />
      <TickerTape />
      <div className="iv-view iv-news-view">
        <div className="iv-news-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={"iv-news-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === "breaking" && breakingCount > 0 && <span className="iv-news-dot" />}
            </button>
          ))}
        </div>

        {hero && (
          <div className="iv-panel iv-news-hero" onClick={() => router.push("/stock/" + hero.ticker)}>
            <div className="iv-news-hero-image" />
            <div className="iv-news-hero-meta">
              <MarketBadge market={hero.market} />
              <span className="mono muted">{hero.ticker}</span>
            </div>
            <h3>{hero.headline}</h3>
            <div className="iv-sub">{hero.source} &middot; {hero.hoursAgo}h ago</div>
          </div>
        )}

        <div className="iv-news-list">
          {rest.slice(0, 24).map((n) => (
            <div key={n.id} className="iv-news-row" onClick={() => router.push("/stock/" + n.ticker)}>
              <div className="iv-news-thumb" />
              <div className="iv-news-row-body">
                <div className="iv-news-headline"><span className="mono muted">{n.ticker}</span> {n.headline}</div>
                <div className="iv-sub">{n.source} &middot; {n.hoursAgo}h ago</div>
              </div>
            </div>
          ))}
          {rest.length === 0 && !hero && <p className="iv-empty-sm">No news in this category right now.</p>}
        </div>
      </div>
    </>
  );
}
