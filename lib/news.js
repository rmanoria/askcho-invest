import { fetchGlobalNews, fetchNgNews } from "./api";

function normalizeArticle(a, i, fallbackId) {
  return {
    // the backend now returns a real numeric id \u2014 fall back only if it's ever missing
    id: a.id != null ? String(a.id) : fallbackId + "-" + i,
    headline: a.headline,
    source: a.source,
    url: a.url,
    summary: a.summary,
    image: a.image || null,
    category: a.category || null,
    // API returns unix seconds; the rest of the app works in ms timestamps
    datetime: a.datetime ? a.datetime * 1000 : Date.now()
  };
}

// Real global news feed, required category: merger | general | forex | crypto
export async function getGlobalNews(category) {
  const data = await fetchGlobalNews(category);
  if (!Array.isArray(data)) return [];
  return data.map((a, i) => normalizeArticle(a, i, "global-" + category));
}

// Real NG news feed \u2014 the backend can return null when no NG-specific
// news is available, so this always resolves to an array.
export async function getNgNews() {
  const data = await fetchNgNews();
  if (!Array.isArray(data)) return [];
  return data.map((a, i) => normalizeArticle(a, i, "ng"));
}

export function hoursAgo(datetimeMs) {
  return Math.max(0, Math.floor((Date.now() - datetimeMs) / 3600000));
}

export function groupLabel(datetimeMs) {
  const h = hoursAgo(datetimeMs);
  if (h <= 24) return "Today";
  if (h <= 48) return "Yesterday";
  return "This week";
}