"use client";
import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { getGlobalNews, getNgNews, hoursAgo } from "@/lib/news";
import { NIGERIA_NEWS_CATEGORIES } from "@/lib/api";
import PageFrame from "@/components/PageFrame";
import Select from "@/components/Select";
import SkeletonHero from "@/components/SkeletonHero";
import SkeletonCard from "@/components/SkeletonCard";

// Category tabs, each wired to a real backend source (forex isn't surfaced as
// a quick tab, same as on the Dashboard \u2014 it's still reachable, just not one of these).
const TABS = [
  { id: "general", label: "General", source: "general" },
  { id: "merger", label: "Merger", source: "merger" },
  { id: "forex", label: "Forex", source: "forex" },
  { id: "crypto", label: "Crypto", source: "crypto" }
];

const GLOBAL_TABS = TABS;
const NIGERIA_TABS = NIGERIA_NEWS_CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  source: category.id
}));
const REGIONS = ["Global", "Africa"];
const AFRICA_COUNTRIES = ["Nigeria"];
const PAGE_SIZE = 7;

export default function NewsPage() {
  const [tab, setTab] = useState(NIGERIA_TABS[0].id);
  const [region, setRegion] = useState("Africa");
  const [country, setCountry] = useState("Nigeria");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  // Nigeria is the only African news source available, so Region: Africa always
  // means the NG feed regardless of the Country sub-choice.
  const isNg = region === "Africa";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setItems([]);
    setPage(1);
    const tabs = isNg ? NIGERIA_TABS : GLOBAL_TABS;
    const selectedTab = tabs.find((t) => t.id === tab) || tabs[0];
    const loader = isNg ? getNgNews(selectedTab.source) : getGlobalNews(selectedTab.source);
    loader
      .then((data) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, isNg]);

  const filtered = items.slice().sort((a, b) => b.datetime - a.datetime);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const [hero, ...cards] = pageItems;

  return (
    <>
      <PageFrame className="iv-news-view">

        <div className="iv-filter-bar">
          <Select compact label="Region" value={region} onChange={(v) => { setRegion(v); setCountry("Nigeria"); setTab(v === "Africa" ? NIGERIA_TABS[0].id : GLOBAL_TABS[0].id); }} options={REGIONS} />
          {region === "Africa" && (
            <Select compact label="Country" value={country} onChange={setCountry} options={AFRICA_COUNTRIES} />
          )}
          <Select compact label="Category" value={tab} onChange={setTab} options={(isNg ? NIGERIA_TABS : GLOBAL_TABS).map((t) => ({ value: t.id, label: t.label }))} />
        </div>

        {loading && (
          <>
            <SkeletonHero />
            <div className="iv-news-masonry">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </>
        )}
        {!loading && error && <p className="iv-empty-sm">Couldn't load news right now. Try another category.</p>}
        {!loading && !error && (
          <p className="iv-sub" style={{ margin: "0 0 20px" }}>{filtered.length} article{filtered.length === 1 ? "" : "s"} in {isNg ? country : (GLOBAL_TABS.find((t) => t.id === tab) || GLOBAL_TABS[0]).label}.</p>
        )}

        {!loading && hero && (
          <a className="iv-panel iv-news-hero" href={hero.url}>
            {hero.image && <div className="iv-news-hero-image" style={{ backgroundImage: "url(" + hero.image + ")" }} />}
            <div className="iv-news-hero-meta">
              <span className="iv-sub">{hero.source} <ExternalLink size={12} /></span>
            </div>
            <h3>{hero.headline}</h3>
            {hero.summary && <p className="iv-sub" style={{ marginTop: 6 }}>{hero.summary}</p>}
            <div className="iv-sub">{hoursAgo(hero.datetime)}h ago</div>
          </a>
        )}

        {cards.length > 0 && (
          <div className="iv-news-masonry">
            {cards.map((n, index) => (
              <a key={n.id} className="iv-news-card" href={n.url}>
                {n.image && <div className="iv-news-card-image" style={{ backgroundImage: `url(${n.image}` }} />}
                <div className="iv-news-card-body">
                  <div className="iv-news-card-meta"><span>{n.source}</span><span>{hoursAgo(n.datetime)}h ago</span></div>
                  <div className="iv-news-headline">{n.headline}</div>
                  {n.summary && <p className="iv-news-card-summary">{n.summary}</p>}
                </div>
                <ExternalLink size={14} className="muted iv-news-card-icon" />
              </a>
            ))}
          </div>
        )}

        {!loading && !error && pageItems.length === 0 && <p className="iv-empty-sm">No news available for this category right now.</p>}

        {!loading && !error && pageCount > 1 && (
          <nav className="iv-news-pagination" aria-label="News pagination">
            <button className="iv-btn-ghost sm" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</button>
            <span className="iv-sub">Page {currentPage} of {pageCount}</span>
            <button className="iv-btn-ghost sm" type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>Next</button>
          </nav>
        )}
      </PageFrame>
    </>
  );
}