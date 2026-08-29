"use client";
import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { fetchNgStocks, fetchGlobalStocks } from "./api";
import { genHistory, getMeta, seedFor, FEATURED_TICKERS } from "./stocks";

const STORAGE_KEY = "askcho-invest-state-v3";
const POLL_MS = 20000; // Render free-tier friendly \u2014 real prices refresh every 20s

const DEFAULT_STATE = {
  user: null,
  session: null,
  watchlist: ["DANGCEM", "AAPL", "GTCO"],
  alerts: [], // { id, ticker, condition, targetPrice, active, createdAt, triggeredAt }
  notifications: [] // { id, text, createdAt, read }
};

const StoreContext = createContext(null);

function mergeStock(raw, market, currency) {
  const ticker = raw.symbol;
  const meta = getMeta(ticker);
  const price = raw.current_price;
  const changePct = raw.percent_change;
  const seed = seedFor(ticker);
  const history = genHistory(seed, price, 90, 0.02);

  // Global gives full OHLC + a real previous close; NG only gives price + % change,
  // so its previous close is derived from those two real numbers (not fabricated).
  const hasOHLC = market === "Global";
  const prevClose = hasOHLC ? raw.previous_close : price / (1 + changePct / 100);

  return {
    ticker,
    name: meta.name,
    sector: meta.sector,
    market,
    currency,
    price,
    changePct,
    change: hasOHLC ? raw.change : price - prevClose,
    prevClose,
    dayHigh: hasOHLC ? raw.high_price : null,
    dayLow: hasOHLC ? raw.low_price : null,
    openPrice: hasOHLC ? raw.open_price : null,
    timestamp: hasOHLC ? raw.timestamp * 1000 : Date.now(),
    history
  };
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);
  const [ngStocks, setNgStocks] = useState([]);
  const [globalStocks, setGlobalStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksUpdatedAt, setStocksUpdatedAt] = useState(null);
  const pollingRef = useRef(null);

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
      const { user, session, watchlist, alerts, notifications } = state;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, session, watchlist, alerts, notifications }));
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

  // Poll the real backend for live NG + Global prices.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ng, global] = await Promise.all([fetchNgStocks(), fetchGlobalStocks()]);
        if (cancelled) return;
        if (Array.isArray(ng)) setNgStocks(ng);
        if (Array.isArray(global)) setGlobalStocks(global);
        setStocksUpdatedAt(Date.now());
      } catch (e) {
        /* keep showing last-known prices on a failed poll */
      } finally {
        if (!cancelled) setStocksLoading(false);
      }
    }

    load();
    pollingRef.current = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(pollingRef.current); };
  }, []);

  const liveStocks = useMemo(() => {
    return [
      ...ngStocks.map((s) => mergeStock(s, "NGX", "NGN")),
      ...globalStocks.map((s) => mergeStock(s, "Global", "USD"))
    ];
  }, [ngStocks, globalStocks]);

  const liveStocksByTicker = useMemo(
    () => Object.fromEntries(liveStocks.map((s) => [s.ticker, s])),
    [liveStocks]
  );

  // fire price alerts as fresh prices come in
  useEffect(() => {
    if (!hydrated || liveStocks.length === 0) return;
    setState((s) => {
      let changed = false;
      const newNotifTexts = [];

      const alerts = s.alerts.map((a) => {
        if (!a.active) return a;
        const live = liveStocksByTicker[a.ticker];
        if (!live) return a;
        const crossed = a.condition === "above" ? live.price >= a.targetPrice : live.price <= a.targetPrice;
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
  }, [liveStocks, liveStocksByTicker, hydrated]);

  function getAllLiveStocks() { return liveStocks; }
  function getFeaturedLiveStocks() {
    return FEATURED_TICKERS.map((t) => liveStocksByTicker[t]).filter(Boolean);
  }
  function getLiveStock(ticker) { return liveStocksByTicker[ticker] || null; }

  // No index-data endpoint exists, so each index's change is approximated as the
  // average live change across the stocks tracked for that market.
  function getLiveIndexes() {
    const ngAvg = ngStocks.length ? ngStocks.reduce((a, s) => a + s.percent_change, 0) / ngStocks.length : 0;
    const globalAvg = globalStocks.length ? globalStocks.reduce((a, s) => a + s.percent_change, 0) / globalStocks.length : 0;
    const bases = { "NGX ASI": { seed: 501, base: 101452.3, changePct: ngAvg }, "NYSE Composite": { seed: 502, base: 19875.4, changePct: globalAvg }, "NASDAQ Composite": { seed: 503, base: 18230.1, changePct: globalAvg } };
    return Object.entries(bases).map(([name, cfg]) => ({
      name,
      value: cfg.base * (1 + cfg.changePct / 100),
      changePct: cfg.changePct,
      history: genHistory(cfg.seed, cfg.base * (1 + cfg.changePct / 100), 60, 0.006)
    }));
  }

  function login(user, session = null) { setState((s) => ({ ...s, user, session: session || s.session })); }
  function logout() { setState((s) => ({ ...s, user: null, session: null })); }

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
    stocksLoading,
    stocksUpdatedAt,
    notify,
    getLiveStock,
    getAllLiveStocks,
    getFeaturedLiveStocks,
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