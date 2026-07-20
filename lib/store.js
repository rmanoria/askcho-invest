"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { STOCKS, FIXED_INCOME_PRODUCTS, toNGN } from "./stocks";
import { formatNGN, formatShares } from "./format";

const STORAGE_KEY = "askcho-invest-state-v1";

const DEFAULT_STATE = {
  user: null,
  cash: 5000000,
  portfolio: [], // { ticker, shares, avgCostNGN }
  watchlist: ["DANGCEM", "AAPL", "GTCO"],
  orders: [], // { id, ticker, side, orderType, shares, limitPrice, status, createdAt }
  transactions: [], // { id, type, amount, method, createdAt }
  alerts: [], // { id, ticker, condition, targetPrice, active, createdAt, triggeredAt }
  autoInvests: [], // { id, ticker, amountNGN, frequency, active, createdAt, lastRun }
  fixedIncomeHoldings: [], // { id, productId, amount, payout, startedAt, maturityDate }
  notifications: [], // { id, text, createdAt, read }
  livePrices: Object.fromEntries(STOCKS.map((s) => [s.ticker, s.price]))
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setState((s) => ({ ...s, ...saved }));
      }
    } catch (e) {
      /* corrupt or unavailable storage, ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage full or unavailable, ignore */
    }
  }, [state, hydrated]);

  function notify(msg) { setToast(msg); }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // simulated live market ticks
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      setState((s) => {
        const nextPrices = { ...s.livePrices };
        STOCKS.forEach((stock) => {
          const cur = nextPrices[stock.ticker] ?? stock.price;
          const vol = stock.vol || 0.02;
          const drift = (Math.random() - 0.5) * vol * 0.18 * stock.price;
          nextPrices[stock.ticker] = Math.max(cur + drift, stock.price * 0.3);
        });
        return { ...s, livePrices: nextPrices };
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [hydrated]);

  // auto-fill pending limit orders + fire price alerts as live prices move
  useEffect(() => {
    if (!hydrated) return;
    setState((s) => {
      let changed = false;
      let cash = s.cash;
      let portfolio = s.portfolio;
      const newNotifTexts = [];

      function fill(ticker, side, shares) {
        const base = STOCKS.find((x) => x.ticker === ticker);
        const priceNGN = toNGN(s.livePrices[ticker] ?? base.price, base.currency);
        if (side === "buy") {
          const cost = priceNGN * shares;
          if (cost > cash) return false;
          cash -= cost;
          const existing = portfolio.find((h) => h.ticker === ticker);
          portfolio = existing
            ? portfolio.map((h) => (h.ticker === ticker ? { ...h, shares: h.shares + shares, avgCostNGN: (h.avgCostNGN * h.shares + cost) / (h.shares + shares) } : h))
            : [...portfolio, { ticker, shares, avgCostNGN: priceNGN }];
          return true;
        }
        const existing = portfolio.find((h) => h.ticker === ticker);
        if (!existing || existing.shares < shares) return false;
        cash += priceNGN * shares;
        const remaining = existing.shares - shares;
        portfolio = remaining <= 0 ? portfolio.filter((h) => h.ticker !== ticker) : portfolio.map((h) => (h.ticker === ticker ? { ...h, shares: remaining } : h));
        return true;
      }

      const orders = s.orders.map((o) => {
        if (o.status !== "pending") return o;
        const base = STOCKS.find((x) => x.ticker === o.ticker);
        const liveNGN = toNGN(s.livePrices[o.ticker] ?? base.price, base.currency);
        const limitNGN = toNGN(o.limitPrice, base.currency);
        const shouldFill = o.side === "buy" ? limitNGN >= liveNGN : limitNGN <= liveNGN;
        if (!shouldFill) return o;
        changed = true;
        const ok = fill(o.ticker, o.side, o.shares);
        newNotifTexts.push(ok ? "Limit order filled: " + o.side + " " + formatShares(o.shares) + " " + o.ticker : "Limit order for " + o.ticker + " could not be filled");
        return { ...o, status: ok ? "filled" : "rejected" };
      });

      const alerts = s.alerts.map((a) => {
        if (!a.active) return a;
        const base = STOCKS.find((x) => x.ticker === a.ticker);
        const live = s.livePrices[a.ticker] ?? base.price;
        const crossed = a.condition === "above" ? live >= a.targetPrice : live <= a.targetPrice;
        if (!crossed) return a;
        changed = true;
        newNotifTexts.push(a.ticker + " crossed " + (a.condition === "above" ? "above " : "below ") + a.targetPrice.toLocaleString());
        return { ...a, active: false, triggeredAt: Date.now() };
      });

      if (!changed) return s;

      const notifications = [
        ...newNotifTexts.map((text) => ({ id: Date.now() + "-" + Math.random().toString(16).slice(2), text, createdAt: Date.now(), read: false })),
        ...s.notifications
      ].slice(0, 40);

      return { ...s, orders, alerts, cash, portfolio, notifications };
    });
  }, [state.livePrices, hydrated]);

  function getLiveStock(ticker) {
    const base = STOCKS.find((s) => s.ticker === ticker);
    if (!base) return null;
    const price = state.livePrices[ticker] ?? base.price;
    const first = base.history[0].price;
    const changePct = ((price - first) / first) * 100;
    return { ...base, price, changePct };
  }
  function getAllLiveStocks() {
    return STOCKS.map((s) => getLiveStock(s.ticker));
  }

  function login(user) { setState((s) => ({ ...s, user })); }
  function logout() { setState((s) => ({ ...s, user: null })); }

  function buy(ticker, shares, silent) {
    const base = STOCKS.find((x) => x.ticker === ticker);
    const priceNGN = toNGN(state.livePrices[ticker] ?? base.price, base.currency);
    const cost = priceNGN * shares;
    if (cost > state.cash) { if (!silent) notify("Insufficient cash for that order"); return false; }
    setState((s) => {
      const existing = s.portfolio.find((h) => h.ticker === ticker);
      const portfolio = existing
        ? s.portfolio.map((h) => (h.ticker === ticker ? { ...h, shares: h.shares + shares, avgCostNGN: (h.avgCostNGN * h.shares + cost) / (h.shares + shares) } : h))
        : [...s.portfolio, { ticker, shares, avgCostNGN: priceNGN }];
      return { ...s, cash: s.cash - cost, portfolio };
    });
    if (!silent) notify("Bought " + formatShares(shares) + " share" + (shares > 1 ? "s" : "") + " of " + ticker);
    return true;
  }

  function sell(ticker, shares, silent) {
    const base = STOCKS.find((x) => x.ticker === ticker);
    const priceNGN = toNGN(state.livePrices[ticker] ?? base.price, base.currency);
    const existing = state.portfolio.find((h) => h.ticker === ticker);
    if (!existing || existing.shares < shares) { if (!silent) notify("Not enough shares to sell"); return false; }
    setState((s) => {
      const cur = s.portfolio.find((h) => h.ticker === ticker);
      if (!cur || cur.shares < shares) return s;
      const remaining = cur.shares - shares;
      const portfolio = remaining <= 0 ? s.portfolio.filter((h) => h.ticker !== ticker) : s.portfolio.map((h) => (h.ticker === ticker ? { ...h, shares: remaining } : h));
      return { ...s, cash: s.cash + priceNGN * shares, portfolio };
    });
    if (!silent) notify("Sold " + formatShares(shares) + " share" + (shares > 1 ? "s" : "") + " of " + ticker);
    return true;
  }

  function placeOrder({ ticker, side, orderType, shares, limitPrice }) {
    const base = STOCKS.find((x) => x.ticker === ticker);
    const id = Date.now() + "-" + Math.random().toString(16).slice(2);

    if (orderType === "market") {
      const ok = side === "buy" ? buy(ticker, shares) : sell(ticker, shares);
      setState((s) => ({ ...s, orders: [{ id, ticker, side, orderType, shares, limitPrice: null, status: ok ? "filled" : "rejected", createdAt: Date.now() }, ...s.orders] }));
      return ok;
    }

    const liveNGN = toNGN(state.livePrices[ticker] ?? base.price, base.currency);
    const limitNGN = toNGN(limitPrice, base.currency);
    const shouldFillNow = side === "buy" ? limitNGN >= liveNGN : limitNGN <= liveNGN;

    if (shouldFillNow) {
      const ok = side === "buy" ? buy(ticker, shares) : sell(ticker, shares);
      setState((s) => ({ ...s, orders: [{ id, ticker, side, orderType, shares, limitPrice, status: ok ? "filled" : "rejected", createdAt: Date.now() }, ...s.orders] }));
      return ok;
    }

    setState((s) => ({ ...s, orders: [{ id, ticker, side, orderType, shares, limitPrice, status: "pending", createdAt: Date.now() }, ...s.orders] }));
    notify("Limit order placed for " + ticker + " \u2014 it will fill when the price is reached");
    return true;
  }

  function cancelOrder(id) {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)) }));
    notify("Order cancelled");
  }

  function toggleWatch(ticker) {
    const isWatched = state.watchlist.includes(ticker);
    setState((s) => ({ ...s, watchlist: isWatched ? s.watchlist.filter((t) => t !== ticker) : [...s.watchlist, ticker] }));
    notify(isWatched ? "Removed " + ticker + " from watchlist" : "Added " + ticker + " to watchlist");
  }

  function fund(type, amount, method) {
    if (type === "withdraw" && amount > state.cash) { notify("Insufficient balance to withdraw that amount"); return false; }
    setState((s) => ({
      ...s,
      cash: type === "deposit" ? s.cash + amount : s.cash - amount,
      transactions: [{ id: Date.now() + "-" + Math.random().toString(16).slice(2), type, amount, method, createdAt: Date.now() }, ...s.transactions]
    }));
    notify((type === "deposit" ? "Deposited " : "Withdrew ") + formatNGN(amount));
    return true;
  }

  function addAlert(ticker, condition, targetPrice) {
    setState((s) => ({ ...s, alerts: [{ id: Date.now() + "-" + Math.random().toString(16).slice(2), ticker, condition, targetPrice, active: true, createdAt: Date.now() }, ...s.alerts] }));
    notify("Alert set for " + ticker);
  }
  function removeAlert(id) {
    setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) }));
  }

  function addAutoInvest(ticker, amountNGN, frequency) {
    setState((s) => ({ ...s, autoInvests: [{ id: Date.now() + "-" + Math.random().toString(16).slice(2), ticker, amountNGN, frequency, active: true, createdAt: Date.now(), lastRun: null }, ...s.autoInvests] }));
    notify("Auto-invest plan created for " + ticker);
  }
  function removeAutoInvest(id) {
    setState((s) => ({ ...s, autoInvests: s.autoInvests.filter((p) => p.id !== id) }));
    notify("Auto-invest plan removed");
  }
  function runAutoInvestNow(id) {
    const plan = state.autoInvests.find((p) => p.id === id);
    if (!plan) return;
    const base = STOCKS.find((x) => x.ticker === plan.ticker);
    const priceNGN = toNGN(state.livePrices[plan.ticker] ?? base.price, base.currency);
    if (plan.amountNGN > state.cash) { notify("Not enough cash to run this plan"); return; }
    const shares = plan.amountNGN / priceNGN;
    setState((s) => {
      const existing = s.portfolio.find((h) => h.ticker === plan.ticker);
      const portfolio = existing
        ? s.portfolio.map((h) => (h.ticker === plan.ticker ? { ...h, shares: h.shares + shares, avgCostNGN: (h.avgCostNGN * h.shares + plan.amountNGN) / (h.shares + shares) } : h))
        : [...s.portfolio, { ticker: plan.ticker, shares, avgCostNGN: priceNGN }];
      return {
        ...s,
        cash: s.cash - plan.amountNGN,
        portfolio,
        autoInvests: s.autoInvests.map((p) => (p.id === id ? { ...p, lastRun: Date.now() } : p)),
        transactions: [{ id: Date.now() + "-" + Math.random().toString(16).slice(2), type: "auto-invest", amount: plan.amountNGN, method: plan.ticker, createdAt: Date.now() }, ...s.transactions]
      };
    });
    notify("Invested " + formatNGN(plan.amountNGN) + " into " + plan.ticker);
  }

  function investFixedIncome(productId, amount) {
    const product = FIXED_INCOME_PRODUCTS.find((p) => p.id === productId);
    if (!product) return false;
    if (amount < product.minAmount) { notify("Minimum investment is " + formatNGN(product.minAmount)); return false; }
    if (amount > state.cash) { notify("Insufficient cash balance"); return false; }
    const maturityDate = Date.now() + product.tenorDays * 24 * 60 * 60 * 1000;
    const payout = amount * (1 + (product.rate / 100) * (product.tenorDays / 365));
    setState((s) => ({
      ...s,
      cash: s.cash - amount,
      fixedIncomeHoldings: [{ id: Date.now() + "-" + Math.random().toString(16).slice(2), productId, amount, payout, startedAt: Date.now(), maturityDate }, ...s.fixedIncomeHoldings]
    }));
    notify("Invested " + formatNGN(amount) + " in " + product.name);
    return true;
  }

  function markNotificationsRead() {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }
  function clearNotifications() {
    setState((s) => ({ ...s, notifications: [] }));
  }

  const value = {
    state,
    hydrated,
    toast,
    notify,
    getLiveStock,
    getAllLiveStocks,
    login,
    logout,
    buy,
    sell,
    placeOrder,
    cancelOrder,
    toggleWatch,
    fund,
    addAlert,
    removeAlert,
    addAutoInvest,
    removeAutoInvest,
    runAutoInvestNow,
    investFixedIncome,
    markNotificationsRead,
    clearNotifications
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
