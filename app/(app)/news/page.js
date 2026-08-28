"use client";
import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { getGlobalNews, getNgNews, hoursAgo, groupLabel } from "@/lib/news";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import Select from "@/components/Select";
import ArticleViewerModal from "@/components/ArticleViewerModal";

// Category tabs, each wired to a real backend source (forex isn't surfaced as
// a quick tab, same as on the Dashboard \u2014 it's still reachable, just not one of these).
const TABS = [
  { id: "featured", label: "Featured", source: "general" },
  { id: "breaking", label: "Breaking", source: "merger" },
  { id: "popular", label: "Most popular", source: "forex" },
  { id: "global", label: "Global", source: "crypto" }
];

// Region/Country is the real NG-vs-Global split; Category tabs then pick which
// real category to show within the Global feed, same pattern as the Dashboard.
const REGIONS = ["Africa", "America", "Europe", "Asia", "Global"];
const AFRICA_COUNTRIES = ["Nigeria", "All"];

export default function NewsPage() {
  const [tab, setTab] = useState("featured");
  const [region, setRegion] = useState("Africa");
  const [country, setCountry] = useState("Nigeria");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewerArticle, setViewerArticle] = useState(null);
  // Nigeria is the only African news source available, so Region: Africa always
  // means the NG feed regardless of the Country sub-choice.
  const isNg = region === "Africa";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const source = TABS.find((t) => t.id === tab).source;
    const loader = isNg ? getNgNews() : getGlobalNews(source);
    loader
      .then((data) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, isNg]);

  const filtered = items.slice().sort((a, b) => b.datetime - a.datetime);

  const [hero, ...rest] = filtered;
  const groups = [];
  rest.forEach((n) => {
    const label = groupLabel(n.datetime);
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
          <Select compact label="Region" value={region} onChange={(v) => { setRegion(v); setCountry("Nigeria"); }} options={REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" value={country} onChange={setCountry} options={AFRICA_COUNTRIES} />
          )}
          <Select compact label="Category" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.id, label: t.label }))} />
        </div>

        {loading && <p className="iv-empty-sm">Loading news\u2026</p>}
        {!loading && error && <p className="iv-empty-sm">Couldn't load news right now. Try another category.</p>}
        {!loading && !error && (
          <p className="iv-sub" style={{ margin: "0 0 20px" }}>{filtered.length} article{filtered.length === 1 ? "" : "s"} in {isNg ? (country !== "All" ? country : "Africa") : TABS.find((t) => t.id === tab).label}.</p>
        )}

        {!loading && hero && (
          <a className="iv-panel iv-news-hero" href={hero.url} onClick={(e) => { e.preventDefault(); setViewerArticle(hero); }}>
            {hero.image && <div className="iv-news-hero-image" style={{ backgroundImage: "url(" + hero.image + ")" }} />}
            <div className="iv-news-hero-meta">
              <span className="iv-sub">{hero.source} <ExternalLink size={12} /></span>
            </div>
            <h3>{hero.headline}</h3>
            {hero.summary && <p className="iv-sub" style={{ marginTop: 6 }}>{hero.summary}</p>}
            <div className="iv-sub">{hoursAgo(hero.datetime)}h ago</div>
          </a>
        )}

        {groups.map((group) => (
          <div key={group.label} className="iv-news-group">
            <div className="iv-eyebrow">{group.label.toUpperCase()}</div>
            <div className="iv-news-list">
              {group.items.map((n) => (
                <a key={n.id} className="iv-news-row" href={n.url} onClick={(e) => { e.preventDefault(); setViewerArticle(n); }}>
                  {n.image && <div className="iv-news-thumb" style={{ backgroundImage: "url(" + n.image + ")" }} />}
                  <div className="iv-news-row-body">
                    <div className="iv-news-headline">{n.headline}</div>
                    <div className="iv-sub">{n.source} &middot; {hoursAgo(n.datetime)}h ago</div>
                  </div>
                  <ExternalLink size={14} className="muted" />
                </a>
              ))}
            </div>
          </div>
        ))}
        {!loading && !error && groups.length === 0 && !hero && <p className="iv-empty-sm">No news available for this category right now.</p>}
      </div>
      <ArticleViewerModal article={viewerArticle} onClose={() => setViewerArticle(null)} />
    </>
  );
}