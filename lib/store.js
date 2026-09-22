"use client";
import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { addPriceAlert, addWatchlistItem, fetchNgStocks, fetchGlobalStocks, fetchPriceAlerts, fetchWatchlist, removePriceAlert, removeWatchlistItem, updateUserProfile } from "./api";
import { getCurrentIdToken, signOut, subscribeToAuthChanges } from "./auth";
import { getMeta, FEATURED_TICKERS } from "./stocks";

const POLL_MS = 20000; // Render free-tier friendly \u2014 real prices refresh every 20s

const DEFAULT_STATE = {
  user: null,
  session: null,
  region: "Africa",
  watchlist: [],
  alerts: [], // { id, ticker, condition, targetPrice, active, createdAt, triggeredAt }
  notifications: [] // { id, text, createdAt, read }
};

const StoreContext = createContext(null);

function mergeStock(raw, market, currency) {
  const ticker = raw.symbol;
  const meta = getMeta(ticker);
  const price = raw.current_price;
  const changePct = raw.percent_change;

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
    timestamp: raw.timestamp ? raw.timestamp * 1000 : null,
    history: Array.isArray(raw.history) ? raw.history : []
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
    let cancelled = false;
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (cancelled) return;
      if (!firebaseUser) {
        setState((current) => ({
          ...current,
          user: null,
          session: null,
          watchlist: [],
          alerts: [],
          notifications: []
        }));
        setHydrated(true);
        return;
      }
      try {
        const idToken = await getCurrentIdToken();
        if (cancelled) return;
        setState((current) => ({
          ...current,
          user: {
            name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Investor"),
            email: firebaseUser.email,
            id: firebaseUser.uid
          },
          session: idToken ? { access_token: idToken } : null
        }));
      } catch (error) {
        console.error("Failed to get ID token:", error);
        if (cancelled) return;
        // decide: keep user with no session, or clear entirely
        setState((current) => ({
          ...current,
          user: null,
          session: null
        }));
      } finally {
        if (!cancelled) setHydrated(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const sessionToken = state.session?.access_token;
    if (!hydrated || !sessionToken) return;
    let cancelled = false;

    fetchWatchlist(sessionToken)
      .then((items) => {
        if (cancelled) return;
        setState((current) => ({ ...current, watchlist: items.map((item) => item.identifier) }));
      })
      .catch(() => {
        if (!cancelled) notify("Unable to sync your watchlist");
      });

    return () => { cancelled = true; };
  }, [hydrated, state.session?.access_token]);

  useEffect(() => {
    const sessionToken = state.session?.access_token;
    if (!hydrated || !sessionToken) return;
    let cancelled = false;

    fetchPriceAlerts(sessionToken)
      .then((items) => {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          alerts: items.map((item) => ({
            id: item.id,
            ticker: item.identifier,
            assetType: item.asset_type,
            condition: item.direction,
            targetPrice: Number(item.threshold),
            active: item.is_active,
            createdAt: item.created_at,
            triggeredAt: item.triggered_at,
            triggeredPrice: item.triggered_price == null ? null : Number(item.triggered_price)
          }))
        }));
      })
      .catch(() => {
        if (!cancelled) notify("Unable to sync your price alerts");
      });

    return () => { cancelled = true; };
  }, [hydrated, state.session?.access_token]);

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

  function getAllLiveStocks() { return liveStocks; }
  function getFeaturedLiveStocks() {
    return FEATURED_TICKERS.map((t) => liveStocksByTicker[t]).filter(Boolean);
  }
  function getLiveStock(ticker) { return liveStocksByTicker[ticker] || null; }

  function login(user, session = null) { setState((s) => ({ ...s, user, session: session || s.session })); }
  async function updateProfile(firstName, lastName) {
    const sessionToken = state.session?.access_token;
    if (!sessionToken) {
      notify("Sign in to update your profile");
      return false;
    }
    try {
      const profile = await updateUserProfile({ first_name: firstName, last_name: lastName }, sessionToken);
      setState((s) => ({
        ...s,
        user: { ...s.user, id: profile.id, email: profile.email, name: profile.first_name + " " + profile.last_name, createdAt: profile.created_at }
      }));
      notify("Profile updated");
      return true;
    } catch (e) {
      notify("Unable to update your profile");
      return false;
    }
  }
  async function logout() {
    try {
      await signOut();
    } catch (e) {
      // Always clear local state even if the provider sign-out fails.
    }
    setState((s) => ({ ...s, user: null, session: null, watchlist: [], alerts: [], notifications: [] }));
  }
  function setRegion(region) { setState((s) => ({ ...s, region })); }

  async function toggleWatch(ticker) {
    const isWatched = state.watchlist.includes(ticker);
    const sessionToken = state.session?.access_token;
    const liveStock = liveStocksByTicker[ticker];
    const assetType = liveStock?.market === "NGX" ? "ng_stock" : "global_stock";

    if (!sessionToken) {
      notify("Sign in to manage your watchlist");
      return;
    }

    if (isWatched) {
      setState((s) => ({ ...s, watchlist: s.watchlist.filter((t) => t !== ticker) }));
      try {
        await removeWatchlistItem(assetType, ticker, sessionToken);
        notify("Removed " + ticker + " from watchlist");
      } catch (e) {
        setState((s) => ({ ...s, watchlist: s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker] }));
        notify("Unable to update your watchlist");
      }
      return;
    }

    try {
      await addWatchlistItem(assetType, ticker, sessionToken);
      setState((s) => ({ ...s, watchlist: s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker] }));
      notify("Added " + ticker + " to watchlist");
    } catch (e) {
      notify("Unable to update your watchlist");
    }
  }

  async function addAlert(ticker, condition, targetPrice) {
    const sessionToken = state.session?.access_token;
    const liveStock = liveStocksByTicker[ticker];
    const assetType = liveStock?.market === "NGX" ? "ng_stock" : "global_stock";

    if (!sessionToken) {
      notify("Sign in to create price alerts");
      return;
    }

    try {
      const item = await addPriceAlert({ assetType, identifier: ticker, direction: condition, threshold: targetPrice }, sessionToken);
      setState((s) => ({
        ...s,
        alerts: [{
          id: item.id,
          ticker: item.identifier,
          assetType: item.asset_type,
          condition: item.direction,
          targetPrice: Number(item.threshold),
          active: item.is_active,
          createdAt: item.created_at,
          triggeredAt: item.triggered_at
        }, ...s.alerts]
      }));
      notify("Alert set for " + ticker);
    } catch (e) {
      notify("Unable to create your price alert");
    }
  }
  async function removeAlert(id) {
    const sessionToken = state.session?.access_token;
    if (!sessionToken) {
      notify("Sign in to manage your price alerts");
      return;
    }
    try {
      await removePriceAlert(id, sessionToken);
      setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) }));
    } catch (e) {
      notify("Unable to remove your price alert");
    }
  }

  function markNotificationsRead() {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }
  function clearNotifications() {
    setState((s) => ({ ...s, notifications: [] }));
  }

  const value = {
    state,
    region: state.region,
    hydrated,
    toast,
    stocksLoading,
    stocksUpdatedAt,
    notify,
    getLiveStock,
    getAllLiveStocks,
    getFeaturedLiveStocks,
    login,
    updateProfile,
    logout,
    setRegion,
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