export function formatMoney(n, currency) {
  const symbol = currency === "NGN" ? "\u20a6" : "$";
  return symbol + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNGN(n) {
  return "\u20a6" + Math.round(n).toLocaleString();
}

export function formatCompact(n, currency) {
  const symbol = currency === "USD" ? "$" : "\u20a6";
  if (n >= 1e12) return symbol + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return symbol + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return symbol + (n / 1e6).toFixed(2) + "M";
  return symbol + Number(n).toLocaleString();
}

export function formatLargeAmount(n, currency) {
  const value = Number(n);
  const symbol = currency === "USD" ? "$" : "\u20a6";
  const units = [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"]
  ];
  const unit = units.find(([threshold]) => Math.abs(value) >= threshold);
  if (!unit) return symbol + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const amount = value / unit[0];
  return symbol + amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " " + unit[1];
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
