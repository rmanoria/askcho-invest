# ASKCHO Invest

A Next.js investment app covering NGX, NYSE, NASDAQ and ETFs, plus fixed income
(treasury bills), price alerts, auto-invest (DCA), and a light social/copy-investing
community feed. Styled to match the ASKCHO Technologies marketing site.

Everything runs on **mock data** stored in the browser (`localStorage`) \u2014 there is
no backend yet. Prices simulate a live market with small random ticks every 4
seconds, which also drives pending limit-order fills and price alerts.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 \u2014 you'll land on the login screen. Use "Continue as
demo user" to skip straight in with a 5,000,000 NGN demo cash balance.

## Project structure

```
app/
  layout.js              root layout, wraps the whole app in the state provider
  page.js                redirects to /dashboard or /login based on auth
  login/ signup/ forgot-password/    auth screens
  (app)/                 authenticated route group (sidebar + guard)
    dashboard/  search/  stock/[ticker]/  portfolio/  watchlist/
    orders/  wallet/  learn/  alerts/  auto-invest/  community/
    fixed-income/  settings/
  globals.css             design tokens + all component styles
components/                shared UI (nav, charts, trade panel, modals, tables)
lib/
  stocks.js               mock market data, indexes, fixed-income products, top investors
  store.js                global state (Context) \u2014 auth, portfolio, orders, alerts, etc.
  format.js               currency/date formatting helpers
  tutor.js                canned replies for the AI Investment Tutor
```

## Wiring up real data next

- **Market data**: replace `lib/stocks.js` with calls to a real provider (e.g.
  Finnhub, Alpha Vantage, or an NGX data vendor) and swap the live-price
  simulation in `lib/store.js` for real streaming/polling.
- **Auth**: swap `login()`/`logout()` in `lib/store.js` for a real auth provider
  (NextAuth, Clerk, your own API) instead of the mock localStorage user.
- **Trading & funding**: `placeOrder`, `buy`, `sell`, and `fund` in
  `lib/store.js` are the seams to connect to a real brokerage/payment backend
  (e.g. Paystack/Flutterwave for NGN funding).
- **Persistence**: currently everything lives in `localStorage` via
  `StoreProvider`. Swap for real API calls once there's a backend, keeping the
  same function signatures so components don't need to change.

## Mobile / desktop

This codebase is a standard Next.js app, which makes it straightforward to wrap:

- **Desktop**: [Tauri](https://tauri.app) or Electron around `npm run build && npm run start`.
- **Mobile**: [Capacitor](https://capacitorjs.com) wraps this same app for iOS/Android with minimal changes.
  For a fully native mobile UI instead, you'd rebuild the screens in React Native/Expo,
  reusing the logic in `lib/` (data, pricing, portfolio math) but not the JSX/CSS.
