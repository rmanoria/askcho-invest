// Service layer for the CAM Investment backend (FastAPI).
// Base URL points at the deployed Render instance from the OpenAPI spec.
export const API_BASE = "https://cam-investment.onrender.com";

export const NEWS_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "merger", label: "Mergers" },
  { id: "forex", label: "Forex" },
  { id: "crypto", label: "Crypto" }
];

async function getJSON(path) {
  const res = await fetch(API_BASE + path, { cache: "no-store" });
  if (!res.ok) throw new Error("Request to " + path + " failed with status " + res.status);
  return res.json();
}

// GET /stocks/ng \u2014 array of { symbol, current_price, percent_change }
export function fetchNgStocks() {
  return getJSON("/stocks/ng");
}

// GET /stocks/global \u2014 array of { symbol, current_price, change, percent_change,
// high_price, low_price, open_price, previous_close, timestamp }
export function fetchGlobalStocks() {
  return getJSON("/stocks/global");
}

// GET /news/ng \u2014 array of { headline, source, url, summary, datetime } or null
export function fetchNgNews() {
  return getJSON("/news/ng");
}

// GET /news/global?category=... \u2014 required category: merger | general | forex | crypto
export function fetchGlobalNews(category) {
  return getJSON("/news/global?category=" + encodeURIComponent(category));
}
