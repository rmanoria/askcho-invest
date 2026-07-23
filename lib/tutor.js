export const TUTOR_TOPICS = [
  { keys: ["p/e", "pe ratio", "price to earnings", "price-to-earnings"], a: "The P/E ratio compares a stock's price to how much profit the company makes per share. A P/E of 15 means investors are paying 15 units of currency for every 1 unit of yearly profit. Lower isn't automatically better \u2014 it depends on the company's growth and sector." },
  { keys: ["diversif"], a: "Diversification means spreading your money across different stocks, sectors, and markets so one bad performer doesn't sink your whole portfolio. Holding only NGX bank stocks is riskier than mixing in NASDAQ tech, ETFs, and NGX industrials, for example." },
  { keys: ["dividend"], a: "A dividend is a portion of a company's profit paid out to shareholders, usually per share, often quarterly or annually. Not every company pays one \u2014 growth companies often reinvest profits instead." },
  { keys: ["volatil"], a: "Volatility measures how much a stock's price swings up and down. A highly volatile stock can move 5% in a day; a stable one might move 0.5%. Higher volatility means higher risk and higher potential reward." },
  { keys: ["market cap", "capitalization"], a: "Market capitalization is a company's total value on the stock market \u2014 share price multiplied by total shares outstanding. It's how you compare the size of, say, Dangote Cement to Apple, even across currencies." },
  { keys: ["ngx", "nigerian exchange"], a: "The NGX (Nigerian Exchange) is Nigeria's stock market, home to companies like Dangote Cement, MTN Nigeria, and GTCO. It trades in naira and has different hours and listing rules than NYSE or NASDAQ." },
  { keys: ["watchlist"], a: "A watchlist is a list of stocks you're tracking but don't own yet. Add any stock from Search to keep an eye on its price before deciding to invest." },
  { keys: ["portfolio"], a: "Your portfolio is everything you actually own \u2014 the stocks and funds you've bought, how many shares, and what they're worth right now. It updates as prices move." },
  { keys: ["risk"], a: "Investment risk is the chance you could lose money, or that returns come in lower than expected. Diversifying, understanding a company before buying, and only investing money you can afford to have tied up all help manage it." },
  { keys: ["etf"], a: "An ETF (exchange-traded fund) is a basket of many stocks bundled into a single tradable share. Buying one ETF like SPY gives you exposure to hundreds of companies at once, which is an easy way to diversify without picking individual stocks." },
  { keys: ["limit order"], a: "A limit order only executes at a price you set or better. A buy limit fills at your price or lower; a sell limit fills at your price or higher. It gives you control over price, but there's no guarantee it fills at all." },
  { keys: ["market order"], a: "A market order buys or sells immediately at the best available current price. You get speed and certainty of execution, but not certainty of exact price \u2014 useful when you want in or out right away." },
  { keys: ["treasury bill", "t-bill", "tbill", "fixed income"], a: "A Treasury Bill is a short-term, government-backed loan you make to the government in exchange for a fixed interest rate over a set period \u2014 91, 182, or 364 days. It's considered one of the lowest-risk ways to grow cash in naira." },
  { keys: ["auto invest", "auto-invest", "recurring", "dollar cost", "dca"], a: "Auto-invest (dollar-cost averaging) means investing a fixed amount on a set schedule \u2014 weekly or monthly \u2014 regardless of price. Over time it smooths out the effect of short-term swings instead of trying to time the market." },
  { keys: ["copy", "social invest", "top investor"], a: "Copy or social investing lets you follow experienced investors and see what they hold. It's useful for learning by example, but remember past returns don't guarantee future ones \u2014 always understand what you're holding, not just who held it first." }
];

export function getTutorReply(input) {
  const q = input.toLowerCase();
  const hit = TUTOR_TOPICS.find((t) => t.keys.some((k) => q.includes(k)));
  if (hit) return hit.a;
  return "I don't have an explanation for that yet \u2014 try asking about P/E ratio, diversification, dividends, ETFs, volatility, market cap, or the NGX. Tap a topic chip below to get started.";
}
