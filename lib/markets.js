import { genHistory, INDEXES } from "./stocks";

const EXTRA_INDICES_RAW = [
  { name: "Dow Jones", region: "Americas", seed: 511, base: 42150.6, vol: 0.007 },
  { name: "S&P 500", region: "Americas", seed: 512, base: 6015.3, vol: 0.007 },
  { name: "FTSE 100", region: "Europe", seed: 513, base: 8210.4, vol: 0.006 },
  { name: "DAX", region: "Europe", seed: 514, base: 19340.2, vol: 0.007 },
  { name: "Nikkei 225", region: "Asia", seed: 515, base: 40120.8, vol: 0.008 },
  { name: "Hang Seng", region: "Asia", seed: 516, base: 19870.5, vol: 0.009 }
];

function withHistoryValue(list) {
  return list.map((item) => {
    const history = genHistory(item.seed, item.base ?? item.price, 60, item.vol);
    const first = history[0].price;
    const last = history[history.length - 1].price;
    const changePct = ((last - first) / first) * 100;
    if (item.base !== undefined) return { ...item, history, value: last, changePct };
    return { ...item, history, price: last, changePct };
  });
}

export const ALL_INDICES = [
  ...INDEXES.map((ix) => ({ ...ix, region: ix.name.indexOf("NGX") === 0 ? "Africa" : "Americas" })),
  ...withHistoryValue(EXTRA_INDICES_RAW)
];

export const COMMODITIES = withHistoryValue([
  { ticker: "GOLD", name: "Gold", type: "Metals", currency: "USD", price: 2385.4, seed: 601, vol: 0.012 },
  { ticker: "SILVER", name: "Silver", type: "Metals", currency: "USD", price: 28.6, seed: 602, vol: 0.02 },
  { ticker: "WTI", name: "Crude Oil WTI", type: "Energy", currency: "USD", price: 78.3, seed: 603, vol: 0.025 },
  { ticker: "BRENT", name: "Brent Crude", type: "Energy", currency: "USD", price: 82.1, seed: 604, vol: 0.024 },
  { ticker: "NATGAS", name: "Natural Gas", type: "Energy", currency: "USD", price: 2.85, seed: 605, vol: 0.035 },
  { ticker: "COPPER", name: "Copper", type: "Metals", currency: "USD", price: 4.42, seed: 606, vol: 0.018 },
  { ticker: "COCOA", name: "Cocoa", type: "Agriculture", currency: "USD", price: 8120, seed: 607, vol: 0.03 },
  { ticker: "CORN", name: "Corn", type: "Agriculture", currency: "USD", price: 452.3, seed: 608, vol: 0.017 }
]);

export const CRYPTO = withHistoryValue([
  { ticker: "BTC", name: "Bitcoin", type: "Major", currency: "USD", price: 96500, seed: 701, vol: 0.03 },
  { ticker: "ETH", name: "Ethereum", type: "Major", currency: "USD", price: 3650, seed: 702, vol: 0.035 },
  { ticker: "BNB", name: "BNB", type: "Exchange", currency: "USD", price: 620, seed: 703, vol: 0.03 },
  { ticker: "SOL", name: "Solana", type: "Major", currency: "USD", price: 205, seed: 704, vol: 0.045 },
  { ticker: "XRP", name: "XRP", type: "Payments", currency: "USD", price: 1.15, seed: 705, vol: 0.04 },
  { ticker: "ADA", name: "Cardano", type: "Major", currency: "USD", price: 0.78, seed: 706, vol: 0.038 }
]);

export const CURRENCIES = withHistoryValue([
  { ticker: "USD/NGN", name: "US Dollar / Naira", type: "Majors", currency: "NGN", price: 1550.2, seed: 801, vol: 0.006 },
  { ticker: "EUR/USD", name: "Euro / US Dollar", type: "Majors", currency: "USD", price: 1.082, seed: 802, vol: 0.004 },
  { ticker: "GBP/USD", name: "British Pound / US Dollar", type: "Majors", currency: "USD", price: 1.267, seed: 803, vol: 0.004 },
  { ticker: "USD/JPY", name: "US Dollar / Yen", type: "Majors", currency: "JPY", price: 154.3, seed: 804, vol: 0.005 },
  { ticker: "GBP/NGN", name: "British Pound / Naira", type: "Africa", currency: "NGN", price: 1962.5, seed: 805, vol: 0.007 }
]);

export const BONDS = withHistoryValue([
  { ticker: "NGB10Y", name: "Nigeria 10-Year Bond Yield", type: "Africa", currency: "%", price: 18.9, seed: 901, vol: 0.01 },
  { ticker: "US10Y", name: "US 10-Year Treasury Yield", type: "Americas", currency: "%", price: 4.32, seed: 902, vol: 0.008 },
  { ticker: "UK10Y", name: "UK 10-Year Gilt Yield", type: "Europe", currency: "%", price: 4.05, seed: 903, vol: 0.008 },
  { ticker: "DE10Y", name: "Germany 10-Year Bund Yield", type: "Europe", currency: "%", price: 2.41, seed: 904, vol: 0.007 }
]);

export const FUTURES = withHistoryValue([
  { ticker: "ESF", name: "S&P 500 Futures", type: "Financial", currency: "USD", price: 6020.5, seed: 1001, vol: 0.011 },
  { ticker: "CLF", name: "Crude Oil Futures", type: "Energy", currency: "USD", price: 78.9, seed: 1002, vol: 0.026 },
  { ticker: "GCF", name: "Gold Futures", type: "Metals", currency: "USD", price: 2391.2, seed: 1003, vol: 0.013 },
  { ticker: "ZCF", name: "Corn Futures", type: "Agriculture", currency: "USD", price: 458.1, seed: 1004, vol: 0.018 }
]);

export const MARKET_CATEGORIES = [
  { id: "indices", label: "Indices" },
  { id: "stocks", label: "Stocks" },
  { id: "commodities", label: "Commodities" },
  { id: "crypto", label: "Cryptocurrency" },
  { id: "currencies", label: "Currencies" },
  { id: "funds", label: "Funds" },
  { id: "bonds", label: "Bonds" },
  { id: "futures", label: "Futures" }
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

export function getCalendarEvents() {
  return [
    { id: "e1", date: daysFromNow(1), title: "Dangote Cement Plc Q2 Earnings", type: "Earnings", ticker: "DANGCEM" },
    { id: "e2", date: daysFromNow(2), title: "US Non-Farm Payrolls", type: "Economic" },
    { id: "e3", date: daysFromNow(3), title: "Apple Inc. Q3 Earnings", type: "Earnings", ticker: "AAPL" },
    { id: "e4", date: daysFromNow(4), title: "CBN Monetary Policy Rate Decision", type: "Economic" },
    { id: "e5", date: daysFromNow(5), title: "MTN Nigeria Dividend Ex-Date", type: "Dividend", ticker: "MTNN" },
    { id: "e6", date: daysFromNow(7), title: "US Federal Reserve Interest Rate Decision", type: "Economic" },
    { id: "e7", date: daysFromNow(8), title: "NVIDIA Corp Q2 Earnings", type: "Earnings", ticker: "NVDA" },
    { id: "e8", date: daysFromNow(10), title: "GTCO Dividend Ex-Date", type: "Dividend", ticker: "GTCO" }
  ].sort((a, b) => a.date - b.date);
}
