// Reference metadata + chart-history helpers.
// Live prices/changes now come from the real backend (see lib/api.js + lib/store.js).
// The API has no endpoint for company name/sector or historical series, so those
// stay as static reference data here (name/sector are fixed facts, not live figures).

export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generates a synthetic price path that ends exactly on `endPrice`, used to draw
// sparklines/charts for stocks where the API only gives a current snapshot.
export function genHistory(seed, endPrice, points = 90, vol = 0.02) {
  const rand = seededRandom(seed);
  const arr = [];
  let price = endPrice;
  const forward = [];
  for (let i = points - 1; i >= 0; i--) {
    forward.unshift(Number(price.toFixed(4)));
    const drift = (rand() - 0.5) * vol * endPrice;
    price = Math.max(price - drift, endPrice * 0.4);
  }
  forward.forEach((p, i) => arr.push({ i, price: p }));
  if (arr.length) arr[arr.length - 1].price = Number(endPrice.toFixed(4));
  return arr;
}

function hashSeed(ticker) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) % 100000;
  return h + 1;
}

export const FX_RATE = 1550; // demo NGN per USD, used only for cross-currency display helpers

// Curated reference metadata for well-known names. Any ticker not listed here
// (the API returns ~200+ NGX tickers) still gets a live price \u2014 it just falls
// back to a generic name/sector in lib/store.js's mergeStock().
export const STOCK_META = {
  // NGX
  DANGCEM: { name: "Dangote Cement Plc", sector: "Industrial" },
  MTNN: { name: "MTN Nigeria Communications", sector: "Telecom" },
  GTCO: { name: "Guaranty Trust Holding Co", sector: "Banking" },
  ZENITHBANK: { name: "Zenith Bank Plc", sector: "Banking" },
  BUACEMENT: { name: "BUA Cement Plc", sector: "Industrial" },
  AIRTELAFRI: { name: "Airtel Africa Plc", sector: "Telecom" },
  SEPLAT: { name: "Seplat Energy Plc", sector: "Energy" },
  OKOMUOIL: { name: "Okomu Oil Palm Company", sector: "Agriculture" },
  // Global
  AAPL: { name: "Apple Inc.", sector: "Technology" },
  MSFT: { name: "Microsoft Corp", sector: "Technology" },
  NVDA: { name: "NVIDIA Corp", sector: "Technology" },
  GOOGL: { name: "Alphabet Inc", sector: "Technology" },
  AMZN: { name: "Amazon.com Inc", sector: "Consumer" },
  META: { name: "Meta Platforms Inc", sector: "Technology" },
  TSLA: { name: "Tesla Inc", sector: "Automotive" },
  AMD: { name: "Advanced Micro Devices", sector: "Technology" },
  NFLX: { name: "Netflix Inc", sector: "Media" },
  AVGO: { name: "Broadcom Inc", sector: "Technology" },
  ORCL: { name: "Oracle Corp", sector: "Technology" },
  PLTR: { name: "Palantir Technologies", sector: "Technology" },
  JPM: { name: "JPMorgan Chase & Co", sector: "Banking" },
  V: { name: "Visa Inc", sector: "Financial Services" },
  MA: { name: "Mastercard Inc", sector: "Financial Services" },
  "BRK.B": { name: "Berkshire Hathaway Inc", sector: "Financial Services" },
  COST: { name: "Costco Wholesale Corp", sector: "Consumer" },
  WMT: { name: "Walmart Inc", sector: "Consumer" },
  KO: { name: "Coca-Cola Co", sector: "Consumer" },
  DIS: { name: "Walt Disney Co", sector: "Media" }
};

// Tickers used for the ticker tape, default alert picker, and the Ideas page \u2014
// a readable subset instead of the full ~220-row live universe.
export const FEATURED_TICKERS = Object.keys(STOCK_META);

export function getMeta(ticker) {
  return STOCK_META[ticker] || { name: ticker, sector: "Other" };
}

export function seedFor(ticker) {
  return hashSeed(ticker);
}

export const MARKETS = ["NGX", "Global"];

// Synthetic market indices \u2014 no index endpoint exists in the API, so these
// remain a self-contained simulation (unchanged in spirit from before).
export const INDEXES = [
  { name: "NGX ASI", seed: 501, base: 101452.3 },
  { name: "NYSE Composite", seed: 502, base: 19875.4 },
  { name: "NASDAQ Composite", seed: 503, base: 18230.1 }
].map((ix) => {
  const history = genHistory(ix.seed, ix.base, 60, 0.006);
  const first = history[0].price;
  const last = history[history.length - 1].price;
  return { ...ix, history, value: last, changePct: ((last - first) / first) * 100 };
});

// Fixed income products \u2014 no backing endpoint exists; kept as an illustrative
// static product catalog (a Cowrywise/PiggyVest-style feature Nigerian users expect).
export const FIXED_INCOME_PRODUCTS = [
  { id: "tbill-91", name: "91-Day NGX Treasury Bill", tenorDays: 91, rate: 18.2, minAmount: 50000, risk: "Very low" },
  { id: "tbill-182", name: "182-Day NGX Treasury Bill", tenorDays: 182, rate: 19.6, minAmount: 50000, risk: "Very low" },
  { id: "tbill-364", name: "364-Day NGX Treasury Bill", tenorDays: 364, rate: 21.1, minAmount: 100000, risk: "Very low" },
  { id: "flex-save", name: "Flexible High-Yield Savings", tenorDays: 30, rate: 14.5, minAmount: 5000, risk: "Very low", flexible: true }
];

// Mock "top investors" for the light social/copy-investing feature \u2014 illustrative
// only, no backing endpoint. Holdings are shown as plain tags, not resolved to live prices.
export const TOP_INVESTORS = [
  { id: "u1", name: "Ada O.", handle: "@adainvests", returnPct: 34.2, followers: 2140, topHoldings: ["DANGCEM", "AAPL", "GTCO"], risk: "Medium" },
  { id: "u2", name: "Chidi E.", handle: "@chidicompounds", returnPct: 21.8, followers: 1330, topHoldings: ["NVDA", "MSFT", "SEPLAT"], risk: "Medium-High" },
  { id: "u3", name: "Fatima B.", handle: "@fatimasaves", returnPct: 12.4, followers: 3860, topHoldings: ["WMT", "KO", "ZENITHBANK"], risk: "Low" },
  { id: "u4", name: "Tunde A.", handle: "@tundetrades", returnPct: 46.9, followers: 980, topHoldings: ["TSLA", "PLTR", "AIRTELAFRI"], risk: "High" },
  { id: "u5", name: "Ngozi K.", handle: "@ngozibuilds", returnPct: 17.5, followers: 2510, topHoldings: ["MTNN", "BUACEMENT", "MSFT"], risk: "Low-Medium" }
];

export function toNGN(price, currency) {
  return currency === "NGN" ? price : price * FX_RATE;
}