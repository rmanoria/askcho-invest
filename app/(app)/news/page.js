"use client";
import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { getGlobalNews, getNgNews, hoursAgo, groupLabel } from "@/lib/news";
import { NEWS_CATEGORIES } from "@/lib/api";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import Select from "@/components/Select";

const TABS = [{ id: "ng", label: "Nigeria" }, ...NEWS_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];

export default function NewsPage() {
  const [tab, setTab] = useState("general");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const loader = tab === "ng" ? getNgNews() : getGlobalNews(tab);
    loader
      .then((data) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  const sources = ["All", ...Array.from(new Set(items.map((n) => n.source)))];
  const filtered = (sourceFilter === "All" ? items : items.filter((n) => n.source === sourceFilter))
    .slice()
    .sort((a, b) => b.datetime - a.datetime);

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
          <Select compact label="Category" shortLabel="Cat" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.id, label: t.label }))} />
          <Select compact label="Source" shortLabel="Src" value={sourceFilter} onChange={setSourceFilter} options={sources} />
        </div>

        {loading && <p className="iv-empty-sm">Loading news\u2026</p>}
        {!loading && error && <p className="iv-empty-sm">Couldn't load news right now. Try another category.</p>}
        {!loading && !error && (
          <p className="iv-sub" style={{ margin: "0 0 20px" }}>{filtered.length} article{filtered.length === 1 ? "" : "s"} in {TABS.find((t) => t.id === tab).label}.</p>
        )}

        {!loading && hero && (
          <a className="iv-panel iv-news-hero" href={hero.url} target="_blank" rel="noopener noreferrer">
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
                <a key={n.id} className="iv-news-row" href={n.url} target="_blank" rel="noopener noreferrer">
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
    </>
  );
}