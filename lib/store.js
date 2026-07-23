"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { STOCKS, INDEXES } from "./stocks";

const STORAGE_KEY = "askcho-invest-state-v2";

const DEFAULT_STATE = {
  user: null,
  watchlist: ["DANGCEM", "AAPL", "GTCO"],
  alerts: [], // { id, ticker, condition, targetPrice, active, createdAt, triggeredAt }
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

  // fire price alerts as live prices move
  useEffect(() => {
    if (!hydrated) return;
    setState((s) => {
      let changed = false;
      const newNotifTexts = [];

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

      return { ...s, alerts, notifications };
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

  const INDEX_MARKET_MAP = { "NGX ASI": "NGX", "NYSE Composite": "NYSE", "NASDAQ Composite": "NASDAQ" };
  function getLiveIndexes() {
    return INDEXES.map((ix) => {
      const market = INDEX_MARKET_MAP[ix.name];
      const marketStocks = STOCKS.filter((s) => s.market === market);
      const avgChangePct = marketStocks.length
        ? marketStocks.reduce((sum, s) => {
            const live = state.livePrices[s.ticker] ?? s.price;
            const first = s.history[0].price;
            return sum + ((live - first) / first) * 100;
          }, 0) / marketStocks.length
        : ix.changePct;
      return { ...ix, value: ix.base * (1 + avgChangePct / 100), changePct: avgChangePct };
    });
  }

  function login(user) { setState((s) => ({ ...s, user })); }
  function logout() { setState((s) => ({ ...s, user: null })); }

  function toggleWatch(ticker) {
    const isWatched = state.watchlist.includes(ticker);
    setState((s) => ({ ...s, watchlist: isWatched ? s.watchlist.filter((t) => t !== ticker) : [...s.watchlist, ticker] }));
    notify(isWatched ? "Removed " + ticker + " from watchlist" : "Added " + ticker + " to watchlist");
  }

  function addAlert(ticker, condition, targetPrice) {
    setState((s) => ({ ...s, alerts: [{ id: Date.now() + "-" + Math.random().toString(16).slice(2), ticker, condition, targetPrice, active: true, createdAt: Date.now() }, ...s.alerts] }));
    notify("Alert set for " + ticker);
  }
  function removeAlert(id) {
    setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) }));
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
    getLiveIndexes,
    login,
    logout,
    toggleWatch,
    addAlert,
    removeAlert,
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
