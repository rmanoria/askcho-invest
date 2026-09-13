// Reference metadata + chart-history helpers.
// Live prices/changes now come from the real backend (see lib/api.js + lib/store.js).
// The API has no endpoint for company name/sector or historical series, so those
// stay as static reference data here (name/sector are fixed facts, not live figures).

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
// Readable ticker subset used by compact stock pickers and ticker tape.

export const FEATURED_TICKERS = Object.keys(STOCK_META);

export function getMeta(ticker) {
  return STOCK_META[ticker] || { name: ticker, sector: "Other" };
}

export const MARKETS = ["NGX", "Global"];

// Synthetic market indices \u2014 no index endpoint exists in the API, so these
// remain a self-contained simulation (unchanged in spirit from before).
// Fixed income products \u2014 no backing endpoint exists; kept as an illustrative