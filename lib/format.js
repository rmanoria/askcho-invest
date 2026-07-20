export function formatMoney(n, currency) {
  const symbol = currency === "NGN" ? "\u20a6" : "$";
  return symbol + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNGN(n) {
  return "\u20a6" + Math.round(n).toLocaleString();
}

export function formatCompact(n, currency) {
  const symbol = currency === "NGN" ? "\u20a6" : "$";
  if (n >= 1e12) return symbol + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return symbol + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return symbol + (n / 1e6).toFixed(2) + "M";
  return symbol + Number(n).toLocaleString();
}

export function formatShares(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(ts) {
  return new Date(ts).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
