import { STOCKS, seededRandom } from "./stocks";

const HEADLINE_TEMPLATES = [
  (s) => s.name + " shares move on broader " + s.sector.toLowerCase() + " sector sentiment",
  (s) => "Analysts weigh in on " + s.ticker + "'s next earnings outlook",
  (s) => s.market + " trading volume picks up for " + s.name,
  (s) => s.name + " announces routine board update",
  (s) => "What " + s.ticker + "'s recent price action means for investors",
  (s) => s.name + " extends move as investors reassess " + s.sector.toLowerCase() + " outlook",
  (s) => "Here's what's driving " + s.ticker + " today",
  (s) => s.name + " in focus after " + s.sector.toLowerCase() + " sector rotation"
];

const SOURCES = ["Reuters", "Bloomberg", "NGX Bulletin", "MarketWatch", "This Day", "CNBC", "Business Day"];

export function getAllNews() {
  return STOCKS.flatMap((s) => {
    const rand = seededRandom(s.seed + 700);
    return HEADLINE_TEMPLATES.slice(0, 3).map((tpl, i) => {
      const hoursAgo = Math.floor(rand() * 60) + 1;
      return {
        id: s.ticker + "-n" + i,
        ticker: s.ticker,
        name: s.name,
        market: s.market,
        headline: tpl(s),
        source: SOURCES[Math.floor(rand() * SOURCES.length)],
        hoursAgo,
        category: s.market === "NGX" ? "ngx" : "global",
        breaking: hoursAgo <= 4
      };
    });
  }).sort((a, b) => a.hoursAgo - b.hoursAgo);
}
