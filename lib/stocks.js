// Mock market data engine.
// Deterministic pseudo-random walk so charts look real but stay stable per session.

export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function genHistory(seed, base, points = 90, vol = 0.02) {
  const rand = seededRandom(seed);
  let price = base;
  const arr = [];
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.485) * vol * base;
    price = Math.max(price + drift, base * 0.35);
    arr.push({ i, price: Number(price.toFixed(2)) });
  }
  return arr;
}

export const FX_RATE = 1550; // demo NGN per USD

const RAW_STOCKS = [
  { ticker: "DANGCEM", name: "Dangote Cement Plc", market: "NGX", sector: "Industrial", currency: "NGN", price: 450, seed: 11, vol: 0.02 },
  { ticker: "MTNN", name: "MTN Nigeria Communications", market: "NGX", sector: "Telecom", currency: "NGN", price: 210.5, seed: 12, vol: 0.018 },
  { ticker: "GTCO", name: "Guaranty Trust Holding Co", market: "NGX", sector: "Banking", currency: "NGN", price: 48.75, seed: 13, vol: 0.025 },
  { ticker: "ZENITHBANK", name: "Zenith Bank Plc", market: "NGX", sector: "Banking", currency: "NGN", price: 40.2, seed: 14, vol: 0.022 },
  { ticker: "BUACEMENT", name: "BUA Cement Plc", market: "NGX", sector: "Industrial", currency: "NGN", price: 95.1, seed: 15, vol: 0.02 },
  { ticker: "AIRTELAFRI", name: "Airtel Africa Plc", market: "NGX", sector: "Telecom", currency: "NGN", price: 1850, seed: 16, vol: 0.017 },
  { ticker: "SEPLAT", name: "Seplat Energy Plc", market: "NGX", sector: "Energy", currency: "NGN", price: 4200, seed: 17, vol: 0.03 },
  { ticker: "OKOMUOIL", name: "Okomu Oil Palm Company", market: "NGX", sector: "Agriculture", currency: "NGN", price: 380, seed: 18, vol: 0.019 },
  { ticker: "AAPL", name: "Apple Inc.", market: "NASDAQ", sector: "Technology", currency: "USD", price: 212.4, seed: 21, vol: 0.015 },
  { ticker: "MSFT", name: "Microsoft Corp", market: "NASDAQ", sector: "Technology", currency: "USD", price: 445.6, seed: 22, vol: 0.014 },
  { ticker: "NVDA", name: "NVIDIA Corp", market: "NASDAQ", sector: "Technology", currency: "USD", price: 138.2, seed: 23, vol: 0.028 },
  { ticker: "TSLA", name: "Tesla Inc", market: "NASDAQ", sector: "Automotive", currency: "USD", price: 265.3, seed: 24, vol: 0.035 },
  { ticker: "GOOGL", name: "Alphabet Inc", market: "NASDAQ", sector: "Technology", currency: "USD", price: 178.9, seed: 25, vol: 0.017 },
  { ticker: "AMZN", name: "Amazon.com Inc", market: "NASDAQ", sector: "Consumer", currency: "USD", price: 205.1, seed: 26, vol: 0.02 },
  { ticker: "JPM", name: "JPMorgan Chase & Co", market: "NYSE", sector: "Banking", currency: "USD", price: 215.4, seed: 31, vol: 0.015 },
  { ticker: "DIS", name: "Walt Disney Co", market: "NYSE", sector: "Media", currency: "USD", price: 112.3, seed: 32, vol: 0.02 },
  { ticker: "KO", name: "Coca-Cola Co", market: "NYSE", sector: "Consumer", currency: "USD", price: 68.9, seed: 33, vol: 0.01 },
  { ticker: "BA", name: "Boeing Co", market: "NYSE", sector: "Aerospace", currency: "USD", price: 178.6, seed: 34, vol: 0.03 },
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", market: "ETF", sector: "Broad Market", currency: "USD", price: 612.8, seed: 41, vol: 0.009 },
  { ticker: "QQQ", name: "Invesco QQQ Trust", market: "ETF", sector: "Technology", currency: "USD", price: 528.4, seed: 42, vol: 0.012 },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", market: "ETF", sector: "Broad Market", currency: "USD", price: 561.2, seed: 43, vol: 0.009 },
  { ticker: "ARKK", name: "ARK Innovation ETF", market: "ETF", sector: "Growth", currency: "USD", price: 58.7, seed: 44, vol: 0.03 }
];

export const STOCKS = RAW_STOCKS.map((s) => {
  const history = genHistory(s.seed, s.price, 90, s.vol);
  const first = history[0].price;
  const last = history[history.length - 1].price;
  const changePct = ((last - first) / first) * 100;
  const sharesOutstanding = 150000000 + (s.seed % 40) * 8000000;
  const peRatio = Number((8 + (s.seed % 25)).toFixed(1));
  return {
    ...s,
    history,
    price: last,
    changePct,
    sharesOutstanding,
    peRatio,
    marketCap: last * sharesOutstanding
  };
});

export const MARKETS = ["NGX", "NYSE", "NASDAQ", "ETF"];

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

// Fixed income products \u2014 a category most Robinhood-style stock apps skip
// entirely, but that Nigerian users expect (Cowrywise / PiggyVest style).
export const FIXED_INCOME_PRODUCTS = [
  { id: "tbill-91", name: "91-Day NGX Treasury Bill", tenorDays: 91, rate: 18.2, minAmount: 50000, risk: "Very low" },
  { id: "tbill-182", name: "182-Day NGX Treasury Bill", tenorDays: 182, rate: 19.6, minAmount: 50000, risk: "Very low" },
  { id: "tbill-364", name: "364-Day NGX Treasury Bill", tenorDays: 364, rate: 21.1, minAmount: 100000, risk: "Very low" },
  { id: "flex-save", name: "Flexible High-Yield Savings", tenorDays: 30, rate: 14.5, minAmount: 5000, risk: "Very low", flexible: true }
];

// Mock "top investors" for the light social/copy-investing feature \u2014
// eToro's signature idea, generally missing from Nigerian-first apps.
export const TOP_INVESTORS = [
  { id: "u1", name: "Ada O.", handle: "@adainvests", returnPct: 34.2, followers: 2140, topHoldings: ["DANGCEM", "AAPL", "GTCO"], risk: "Medium" },
  { id: "u2", name: "Chidi E.", handle: "@chidicompounds", returnPct: 21.8, followers: 1330, topHoldings: ["NVDA", "MSFT", "SEPLAT"], risk: "Medium-High" },
  { id: "u3", name: "Fatima B.", handle: "@fatimasaves", returnPct: 12.4, followers: 3860, topHoldings: ["SPY", "VOO", "ZENITHBANK"], risk: "Low" },
  { id: "u4", name: "Tunde A.", handle: "@tundetrades", returnPct: 46.9, followers: 980, topHoldings: ["TSLA", "ARKK", "AIRTELAFRI"], risk: "High" },
  { id: "u5", name: "Ngozi K.", handle: "@ngozibuilds", returnPct: 17.5, followers: 2510, topHoldings: ["MTNN", "BUACEMENT", "QQQ"], risk: "Low-Medium" }
];

export function getStock(ticker) {
  return STOCKS.find((s) => s.ticker === ticker) || null;
}

const NEWS_TEMPLATES = [
  (s) => s.name + " shares move on broader " + s.sector.toLowerCase() + " sector sentiment",
  (s) => "Analysts weigh in on " + s.ticker + "'s next earnings outlook",
  (s) => s.market + " trading volume picks up for " + s.name,
  (s) => s.name + " announces routine board update",
  (s) => "What " + s.ticker + "'s recent price action means for investors"
];

export function getMockNews(ticker) {
  const s = getStock(ticker);
  if (!s) return [];
  const rand = seededRandom(s.seed + 900);
  return NEWS_TEMPLATES.map((tpl, i) => ({
    id: ticker + "-news-" + i,
    headline: tpl(s),
    source: ["Reuters", "Bloomberg", "NGX Bulletin", "MarketWatch", "This Day"][Math.floor(rand() * 5)],
    hoursAgo: Math.floor(rand() * 48) + 1
  }));
}

export function toNGN(price, currency) {
  return currency === "NGN" ? price : price * FX_RATE;
}
