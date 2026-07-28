"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAllNews } from "@/lib/news";
import { MARKETS } from "@/lib/stocks";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import MarketBadge from "@/components/MarketBadge";
import Select from "@/components/Select";

const TABS = [
  { id: "featured", label: "Featured" },
  { id: "breaking", label: "Breaking" },
  { id: "ngx", label: "NGX" },
  { id: "global", label: "Global" }
];

const REGIONS = ["All", "Africa", "America", "Europe", "Asia", "Global"];
// countries available once "Africa" is picked as the region \u2014 add more as data is added for them
const AFRICA_COUNTRIES = ["All", "Nigeria"];

// NGX-listed names are Africa, everything else in this dataset (NASDAQ/NYSE/ETF) is America
function marketRegion(market) {
  return market === "NGX" ? "Africa" : "America";
}

function groupLabel(hoursAgo) {
  if (hoursAgo <= 24) return "Today";
  if (hoursAgo <= 48) return "Yesterday";
  return "This week";
}

export default function NewsPage() {
  const [tab, setTab] = useState("featured");
  const [marketFilter, setMarketFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [region, setRegion] = useState("All");
  const [country, setCountry] = useState("All");
  const router = useRouter();
  const { getAllLiveStocks } = useStore();
  const all = getAllNews();
  const stockByTicker = Object.fromEntries(getAllLiveStocks().map((s) => [s.ticker, s]));
  const sources = ["All", ...Array.from(new Set(all.map((n) => n.source)))];

  const breakingCount = all.filter((n) => n.breaking).length;
  const categoryOptions = TABS.map((t) => ({
    value: t.id,
    label: t.label + (t.id === "breaking" && breakingCount > 0 ? " (" + breakingCount + ")" : "")
  }));

  let filtered =
    tab === "featured" ? all :
    tab === "breaking" ? all.filter((n) => n.breaking) :
    all.filter((n) => n.category === tab);

  if (marketFilter !== "All") filtered = filtered.filter((n) => n.market === marketFilter);
  if (sourceFilter !== "All") filtered = filtered.filter((n) => n.source === sourceFilter);
  if (region !== "All") filtered = filtered.filter((n) => marketRegion(n.market) === region);
  if (region === "Africa" && country === "Nigeria") filtered = filtered.filter((n) => n.market === "NGX");
  filtered = [...filtered].sort((a, b) => a.hoursAgo - b.hoursAgo);

  const [hero, ...rest] = filtered.length ? filtered : all;

  const groups = [];
  rest.slice(0, 40).forEach((n) => {
    const label = groupLabel(n.hoursAgo);
    let group = groups.find((g) => g.label === label);
    if (!group) { group = { label, items: [] }; groups.push(group); }
    group.items.push(n);
  });

  return (
    <>
      <Topbar />
      <TickerTape />
      <div className="iv-view iv-news-view">

        <div className="iv-filter-bar">
          <Select compact label="Category" shortLabel="Cat" value={tab} onChange={setTab} options={categoryOptions} />
          <Select compact label="Market" shortLabel="Mkt" value={marketFilter} onChange={setMarketFilter} options={["All", ...MARKETS]} />
          <Select compact label="Region" shortLabel="Reg" value={region} onChange={(v) => { setRegion(v); setCountry("All"); }} options={REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" shortLabel="Ctry" value={country} onChange={setCountry} options={AFRICA_COUNTRIES} />
          )}
          <Select compact label="Source" shortLabel="Src" value={sourceFilter} onChange={setSourceFilter} options={sources} />
        </div>

        <p className="iv-sub" style={{ margin: "0 0 20px" }}>{filtered.length} article{filtered.length === 1 ? "" : "s"} match these filters.</p>

        {hero && (
          <div className="iv-panel iv-news-hero" onClick={() => router.push("/stock/" + hero.ticker)}>
            <div className="iv-news-hero-image" style={{ backgroundImage: "url(" + hero.image + ")" }} />
            <div className="iv-news-hero-meta">
              <MarketBadge market={hero.market} />
              <span className="mono muted">{hero.ticker}</span>
              {stockByTicker[hero.ticker] && (
                <span className={"iv-chg " + (stockByTicker[hero.ticker].changePct >= 0 ? "pos" : "neg")}>
                  {formatMoney(stockByTicker[hero.ticker].price, stockByTicker[hero.ticker].currency)} &middot; {stockByTicker[hero.ticker].changePct >= 0 ? "+" : ""}{stockByTicker[hero.ticker].changePct.toFixed(2)}%
                </span>
              )}
            </div>
            <h3>{hero.headline}</h3>
            <div className="iv-sub">{hero.source} &middot; {hero.hoursAgo}h ago</div>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label} className="iv-news-group">
            <div className="iv-eyebrow">{group.label.toUpperCase()}</div>
            <div className="iv-news-list">
              {group.items.map((n) => (
                <div key={n.id} className="iv-news-row" onClick={() => router.push("/stock/" + n.ticker)}>
                  <div className="iv-news-thumb" style={{ backgroundImage: "url(" + n.image + ")" }} />
                  <div className="iv-news-row-body">
                    <div className="iv-news-headline"><span className="mono muted">{n.ticker}</span> {n.headline}</div>
                    <div className="iv-sub">
                      {n.source} &middot; {n.hoursAgo}h ago
                      {stockByTicker[n.ticker] && (
                        <span className={"iv-chg " + (stockByTicker[n.ticker].changePct >= 0 ? "pos" : "neg")} style={{ marginLeft: 8 }}>
                          {stockByTicker[n.ticker].changePct >= 0 ? "+" : ""}{stockByTicker[n.ticker].changePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && !hero && <p className="iv-empty-sm">No news matches these filters.</p>}
      </div>
    </>
  );
}