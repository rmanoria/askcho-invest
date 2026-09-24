import { fetchGlobalNews, fetchNgNews } from "./api";

function normalizeTimestamp(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value < 100000000000 ? value * 1000 : value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeArticle(a, i, fallbackId) {
  const datetime = normalizeTimestamp(a.datetime ?? a.published_at);
  return {
    // the backend now returns a real numeric id \u2014 fall back only if it's ever missing
    id: a.id != null ? String(a.id) : fallbackId + "-" + i,
    headline: a.headline,
    source: a.source,
    url: a.url,
    summary: a.summary || "",
    image: a.image || null,
    category: a.category || null,
    published_at: a.published_at || null,
    datetime
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
export async function getNgNews(category) {
  const data = await fetchNgNews(category);
  if (!Array.isArray(data)) return [];
  return data.map((a, i) => normalizeArticle(a, i, "ng-" + (category || "general")));
}

export function hoursAgo(datetimeMs) {
  if (!datetimeMs) return "";
  return Math.max(0, Math.floor((Date.now() - datetimeMs) / 3600000));
}

export function relativeTime(datetimeMs) {
  const hours = hoursAgo(datetimeMs);
  if (hours === "") return "";
  if (hours <= 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days <= 30) return `${days}d`;

  return `${Math.floor(days / 30)}mo`;
}

export function groupLabel(datetimeMs) {
  const h = hoursAgo(datetimeMs);
  if (h <= 24) return "Today";
  if (h <= 48) return "Yesterday";
  return "This week";
}