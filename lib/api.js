// Service layer for the CAM Investment backend (FastAPI).
// Base URL points at the deployed Render instance from the OpenAPI spec.
export const API_BASE = "https://cam-investment.onrender.com";
export const NIGERIA_NEWS_CATEGORIES = [
  { id: "corporate-news", label: "Corporate" },
  { id: "economy", label: "Economy" },
  { id: "industries", label: "Industries" },
  { id: "technology", label: "Technology" },
  { id: "personal-finance", label: "Personal Finance" },
  { id: "product-updates", label: "Product Updates" }
];

export const GLOBAL_NEWS_CATEGORIES = [
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

// GET /stocks/ng — array of { symbol, current_price, percent_change }
export function fetchNgStocks() {
  return getJSON("/stocks/ng");
}

// GET /stocks/global — array of { symbol, current_price, change, percent_change,
// high_price, low_price, open_price, previous_close, timestamp }
export function fetchGlobalStocks() {
  return getJSON("/stocks/global");
}

// GET /news/ng — array of { headline, source, url, summary, datetime } or null
export function fetchNgNews(category) {
  return getJSON("/news/ng?category=" + encodeURIComponent(category));
}

// GET /news/global?category=... — required category: merger | general | forex | crypto
export function fetchGlobalNews(category) {
  return getJSON("/news/global?category=" + encodeURIComponent(category));
}

export function fetchNgIndices() {
  return getJSON("/market/ng/indices");
}

export function fetchGlobalMovers() {
  return getJSON("/market/global/movers");
}

export function fetchNgMovers() {
  return getJSON("/market/ng/movers");
}

// --- New global market endpoints -------------------------------------------

// GET /market/global/forex — array of { pair, exchange_rate, last_refreshed,
// bid_price, ask_price } (or { pair, error } if that pair failed/was throttled).
// pairs: optional array of [from, to] tuples, e.g. [["EUR","USD"],["GBP","NGN"]].
// Omit to get the backend's curated default list.
export function fetchGlobalForex(pairs) {
  const query = pairs?.length
    ? "?pairs=" + pairs.map(([from, to]) => from + "-" + to).join(",")
    : "";
  return getJSON("/market/global/forex" + query);
}

// GET /market/global/crypto — array of { id, price, percent_change_24h,
// market_cap, currency }. `id` is a CoinGecko coin id (e.g. "bitcoin"), not
// a ticker symbol. coinIds: optional array of ids to override the default list.
export function fetchGlobalCrypto(coinIds, vsCurrency = "usd") {
  const params = new URLSearchParams();
  if (coinIds?.length) params.set("coins", coinIds.join(","));
  if (vsCurrency && vsCurrency !== "usd") params.set("vs_currency", vsCurrency);
  const query = params.toString() ? "?" + params.toString() : "";
  return getJSON("/market/global/crypto" + query);
}

// GET /market/global/commodities — array of { commodity, ticker, unit,
// interval, latest_date, latest_value, previous_value, percent_change }.
// functions: optional array of Alpha Vantage commodity function names
// (e.g. ["WTI","BRENT"]). Omit for the curated default list.
export function fetchGlobalCommodities(functions) {
  const query = functions?.length ? "?commodities=" + functions.join(",") : "";
  return getJSON("/market/global/commodities" + query);
}

// GET /market/global/etfs — array of { symbol, current_price, change,
// percent_change, high_price, low_price, open_price, previous_close, timestamp }.
// symbols: optional array of ETF tickers to override the default list.
export function fetchGlobalEtfs(symbols) {
  const query = symbols?.length ? "?symbols=" + symbols.join(",") : "";
  return getJSON("/market/global/etfs" + query);
}

// GET /market/global/mutual-funds — array of { symbol, nav_date, nav,
// previous_nav, percent_change, currency }.
// symbols: optional array of mutual fund tickers to override the default list.
export function fetchGlobalMutualFunds(symbols) {
  const query = symbols?.length ? "?symbols=" + symbols.join(",") : "";
  return getJSON("/market/global/mutual-funds" + query);
}

// GET /market/global/indices — array of { index, proxy_symbol, symbol,
// current_price, change, percent_change, high_price, low_price, open_price,
// previous_close, timestamp }. `index` is the real index name (e.g. "S&P 500");
// `proxy_symbol` is the tracker ETF actually being quoted (e.g. "SPY").
export function fetchGlobalIndices() {
  return getJSON("/market/global/indices");
}

// -----------------------------------------------------------------------------

export async function loginWithPassword(email, password) {
  const res = await fetch(API_BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    let message = "Unable to sign in.";
    try {
      const payload = await res.json();
      message = payload?.detail || payload?.message || message;
    } catch (e) {
      // ignore JSON parse issues and fall back to the default message
    }
    throw new Error(message);
  }

  return res.json();
}

export async function createAccount({ first_name, last_name, email, password }) {
  const res = await fetch(API_BASE + "/users/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name, last_name, email, password })
  });

  if (!res.ok) {
    let message = "Unable to create account.";
    try {
      const payload = await res.json();
      message = payload?.detail || payload?.message || message;
    } catch (e) {
      // ignore JSON parse issues and fall back to the default message
    }
    throw new Error(message);
  }

  return res.json();
}

export async function fetchUserProfile(userId, sessionToken) {
  const res = await fetch(API_BASE + "/users/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + sessionToken
    }
  });

  if (!res.ok) {
    let message = "Unable to fetch user profile.";
    try {
      const payload = await res.json();
      message = payload?.detail || payload?.message || message;
    } catch (e) {
      // ignore JSON parse issues and fall back to the default message
    }
    throw new Error(message);
  }

  return res.json();
}