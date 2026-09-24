// Service layer for the CAM Investment backend (FastAPI).
import { getCurrentIdToken, signOut } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function apiUrl(path) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured");
  return API_BASE + path;
}
export const NIGERIA_NEWS_CATEGORIES = [
  { id: "markets", label: "Markets" },
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
  const res = await fetch(apiUrl(path), { cache: "no-store" });
  if (!res.ok) throw new Error("Request to " + path + " failed with status " + res.status);
  return res.json();
}

async function authenticatedJSON(path, sessionToken, options = {}) {
  const currentToken = await getCurrentIdToken() || sessionToken;
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      "Authorization": "Bearer " + currentToken
    },
    cache: "no-store"
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      await signOut().catch(() => { });
      window.location.assign("/login?reason=session-expired");
    }
    let message = "Request to " + path + " failed with status " + res.status;
    try {
      const payload = await res.json();
      message = payload?.detail || message;
    } catch (e) {
      // Keep the HTTP error when the response has no JSON body.
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function fetchWatchlist(sessionToken) {
  return authenticatedJSON("/watchlist", sessionToken);
}

export function addWatchlistItem(assetType, identifier, sessionToken) {
  return authenticatedJSON("/watchlist", sessionToken, {
    method: "POST",
    body: JSON.stringify({ asset_type: assetType, identifier })
  });
}

export function removeWatchlistItem(assetType, identifier, sessionToken) {
  return authenticatedJSON("/watchlist/" + encodeURIComponent(assetType) + "/" + encodeURIComponent(identifier), sessionToken, {
    method: "DELETE"
  });
}

export function fetchPriceAlerts(sessionToken) {
  return authenticatedJSON("/price-alerts", sessionToken);
}

export function addPriceAlert({ assetType, identifier, direction, threshold }, sessionToken) {
  return authenticatedJSON("/price-alerts", sessionToken, {
    method: "POST",
    body: JSON.stringify({ asset_type: assetType, identifier, direction, threshold })
  });
}

export function removePriceAlert(id, sessionToken) {
  return authenticatedJSON("/price-alerts/" + encodeURIComponent(id), sessionToken, { method: "DELETE" });
}

// GET /stocks/ng — array of { symbol, current_price, percent_change }
export function fetchNgStocks() {
  return getJSON("/stocks/ng");
}

// GET /stocks/global — array of { symbol, current_price, change, percent_change,
// high_price, low_price, open_price, previous_close, timestamp }
export function fetchGlobalStocks(symbols) {
  const query = symbols?.length ? "?symbols=" + symbols.map(encodeURIComponent).join(",") : "";
  return getJSON("/stocks/global" + query);
}

export function fetchGlobalStock(symbol) {
  return getJSON("/stocks/global/" + encodeURIComponent(symbol));
}

export function fetchGlobalCompanyNews(symbol) {
  return getJSON("/stocks/global/" + encodeURIComponent(symbol) + "/news");
}

const NG_CHART_PERIODS = new Set(["7d", "30d", "90d", "1y", "5y", "all"]);

// GET /market/ng/companies/chart/{symbol} — { data: [[timestamp_ms, close]], statistics }
export function fetchNgCompanyChart(symbol, range = {}) {
  const params = new URLSearchParams();
  if (range.from) {
    params.set("from", range.from);
    if (range.to) params.set("to", range.to);
  } else if (NG_CHART_PERIODS.has(range.period)) {
    params.set("period", range.period);
  }

  const query = params.toString() ? "?" + params.toString() : "";
  return getJSON("/market/ng/companies/chart/" + encodeURIComponent(symbol) + query)
    .then((payload) => ({
      ...payload,
      data: Array.isArray(payload?.data)
        ? payload.data
          .filter((point) => Array.isArray(point) && point.length >= 2 && point[1] != null)
          .map(([timestamp, price], index) => ({
            i: index,
            price: Number(price),
            timestamp
          }))
        : []
    }));
}

export function fetchNgCompanyProfile(symbol) {
  return getJSON("/market/ng/companies/profile/" + encodeURIComponent(symbol));
}

function normalizeChartPayload(payload) {
  return {
    ...payload,
    data: Array.isArray(payload?.data)
      ? payload.data
        .filter((point) => Array.isArray(point) && point.length >= 2 && point[1] != null)
        .map(([timestamp, price], index) => ({
          i: index,
          price: Number(price),
          timestamp
        }))
      : []
  };
}

export function fetchNgIndexChart(symbol, range = {}) {
  const params = new URLSearchParams();
  if (range.from) {
    params.set("from", range.from);
    if (range.to) params.set("to", range.to);
  } else if (NG_CHART_PERIODS.has(range.period)) {
    params.set("period", range.period);
  }
  const query = params.toString() ? "?" + params.toString() : "";
  return getJSON("/market/ng/indices/" + encodeURIComponent(symbol) + "/chart" + query).then(normalizeChartPayload);
}

export function fetchNgForexChart(source, target = "NGN", range = {}) {
  const params = new URLSearchParams();
  if (range.from) {
    params.set("from", range.from);
    if (range.to) params.set("to", range.to);
  } else if (NG_CHART_PERIODS.has(range.period)) {
    params.set("period", range.period);
  }
  const query = params.toString() ? "?" + params.toString() : "";
  return getJSON("/market/ng/forex/" + encodeURIComponent(source) + query).then(normalizeChartPayload);
}

// GET /news/ng — array of { headline, source, url, summary, datetime } or null
export function fetchNgNews(category) {
  return getJSON("/news/ng?category=" + encodeURIComponent(category));
}

// GET /news/global?category=... — required category: merger | general | forex | crypto
export function fetchGlobalNews(category) {
  return getJSON("/news/global?category=" + encodeURIComponent(category));
}

export function fetchNewsDigest() {
  return getJSON("/news/ai/digest");
}

export function createConversation(sessionToken) {
  return authenticatedJSON("/conversations/", sessionToken, { method: "POST" });
}

export function fetchConversations(sessionToken) {
  return authenticatedJSON("/conversations/", sessionToken);
}

export function fetchConversation(conversationId, sessionToken) {
  return authenticatedJSON("/conversations/" + encodeURIComponent(conversationId), sessionToken);
}

export function sendConversationMessage(conversationId, message, sessionToken) {
  return authenticatedJSON("/conversations/chat/" + encodeURIComponent(conversationId), sessionToken, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export function sendPublicConversationMessage(message, lastConversationId) {
  return fetch(apiUrl("/conversations/public/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, last_conversation_id: lastConversationId || null }),
    cache: "no-store"
  }).then(async (res) => {
    if (!res.ok) {
      let detail = "Unable to send your message.";
      try {
        const payload = await res.json();
        detail = payload?.detail || detail;
      } catch (error) {
        // Keep the generic message when the response has no JSON body.
      }
      throw new Error(detail);
    }
    return res.json();
  });
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

export function fetchNgForexRates() {
  return getJSON("/market/ng/forex/");
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

// GET /market/global/search — array of { ticker, name, type } for stocks/ETFs,
// or { id, name, symbol } for crypto (assetType="crypto"). Matches only - no
// prices; fetch quotes for the returned tickers/ids separately.
export function searchGlobalSymbol(symbol) {
  return getJSON("/stocks/global/" + encodeURIComponent(symbol));
}

// -----------------------------------------------------------------------------



export function fetchUserProfile(sessionToken) {
  return authenticatedJSON("/users/me", sessionToken);
}

export function updateUserProfile(profile, sessionToken) {
  return authenticatedJSON("/users/me", sessionToken, {
    method: "PATCH",
    body: JSON.stringify(profile)
  });
}