"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Star, Newspaper, BellRing, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { getNgNews } from "@/lib/news";
import { fetchGlobalCompanyNews, fetchGlobalStock, fetchNgCompanyChart, fetchNgCompanyProfile } from "@/lib/api";
import { formatLargeAmount, formatMoney, formatShares } from "@/lib/format";
import PageFrame from "@/components/PageFrame";
import PriceChart from "@/components/PriceChart";
import Stat from "@/components/Stat";
import MarketBadge from "@/components/MarketBadge";
import FlashValue from "@/components/FlashValue";
import Select from "@/components/Select";
import { useAuthGate } from "@/components/AuthGate";

export default function StockPage() {
  const { ticker } = useParams();
  const router = useRouter();
  const { state, getLiveStock, toggleWatch, addAlert, stocksLoading } = useStore();
  const { requireAuth } = useAuthGate();
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState("above");
  const [marketNews, setMarketNews] = useState([]);
  const [resolvedStock, setResolvedStock] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("30d");
  const [chartHistory, setChartHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const tickerKey = String(ticker).toUpperCase();
  const liveStock = getLiveStock(tickerKey);
  const market = liveStock?.market || resolvedStock?.market;

  useEffect(() => {
    setChartPeriod("30d");
    setChartHistory([]);
    setChartError(false);
    setCompanyProfile(null);
    setProfileError(false);
    setLogoError(false);
  }, [tickerKey]);

  useEffect(() => {
    if (market !== "NGX") return undefined;
    let cancelled = false;
    setChartLoading(true);
    setChartError(false);
    fetchNgCompanyChart(tickerKey, { period: chartPeriod })
      .then((payload) => {
        if (cancelled) return;
        if (payload?.error) throw new Error(payload.error);
        setChartHistory(payload?.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setChartHistory([]);
          setChartError(true);
        }
      })
      .finally(() => { if (!cancelled) setChartLoading(false); });
    return () => { cancelled = true; };
  }, [tickerKey, market, chartPeriod]);

  useEffect(() => {
    if (market !== "NGX") return undefined;
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(false);
    fetchNgCompanyProfile(tickerKey)
      .then((payload) => {
        if (cancelled) return;
        if (payload?.error) throw new Error(payload.error);
        setCompanyProfile(payload || null);
      })
      .catch(() => { if (!cancelled) setProfileError(true); })
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [tickerKey, market]);

  useEffect(() => {
    let cancelled = false;
    setResolvedStock(null);
    setFallbackError(false);
    if (liveStock || stocksLoading) return undefined;

    setFallbackLoading(true);
    fetchGlobalStock(tickerKey)
      .then((raw) => {
        if (cancelled || raw?.error || raw?.current_price == null) return;
        setResolvedStock({
          ticker: raw.symbol || tickerKey,
          name: raw.symbol || tickerKey,
          sector: "Global market",
          market: "Global",
          currency: "USD",
          price: raw.current_price,
          changePct: raw.percent_change ?? 0,
          change: raw.change,
          prevClose: raw.previous_close,
          dayHigh: raw.high_price,
          dayLow: raw.low_price,
          openPrice: raw.open_price,
          timestamp: raw.timestamp ? raw.timestamp * 1000 : null,
          history: []
        });
      })
      .catch(() => { if (!cancelled) setFallbackError(true); })
      .finally(() => { if (!cancelled) setFallbackLoading(false); });

    return () => { cancelled = true; };
  }, [tickerKey, liveStock, stocksLoading]);

  useEffect(() => {
    if (!liveStock && !resolvedStock) return;
    const loader = (liveStock?.market || resolvedStock?.market) === "NGX"
      ? getNgNews("corporate-news")
      : fetchGlobalCompanyNews(tickerKey).then((items) => items.map((item, index) => ({
        ...item,
        id: item.id || tickerKey + "-news-" + index,
        datetime: item.datetime ? item.datetime * 1000 : null
      })));
    loader.then(setMarketNews).catch(() => setMarketNews([]));
  }, [tickerKey, liveStock, resolvedStock]);

  const s = liveStock || resolvedStock;

  if (!s) {
    return (
      <>
        <PageFrame title="Stock not found">
          <p className="iv-empty-sm">{stocksLoading || fallbackLoading ? "Loading live prices..." : fallbackError ? "We couldn't find that ticker." : "We couldn't find that ticker."}</p>
        </PageFrame>
      </>
    );
  }

  const watched = state.watchlist.includes(s.ticker);
  const hasOHLC = s.dayHigh !== null && s.dayLow !== null;
  const displayName = companyProfile?.name || s.name;
  const displaySector = companyProfile?.sector || s.sector;
  const profileStats = [
    ["Market cap", companyProfile?.market_cap == null ? null : formatLargeAmount(companyProfile.market_cap, s.currency)],
    ["52-week high", companyProfile?.high_52wk == null ? null : formatMoney(companyProfile.high_52wk, s.currency)],
    ["52-week low", companyProfile?.low_52wk == null ? null : formatMoney(companyProfile.low_52wk, s.currency)],
    ["EPS", companyProfile?.ttm_eps == null ? null : formatMoney(companyProfile.ttm_eps, s.currency)],
    ["Price/Book (P/B)", companyProfile?.pb_ratio == null ? null : Number(companyProfile.pb_ratio).toFixed(2)],
    ["Dividend yield", companyProfile?.dividend_yield == null ? null : Number(companyProfile.dividend_yield).toFixed(2) + "%"],
    ["Shares outstanding", companyProfile?.shares_outstanding == null ? null : formatLargeAmount(companyProfile.shares_outstanding).toLocaleString()],
    ["Trading volume", companyProfile?.volume == null ? null : Number(companyProfile.volume).toLocaleString()],
    ["Value traded", companyProfile?.value_traded == null ? null : formatLargeAmount(companyProfile.value_traded, s.currency)],
    ["Debt / equity", companyProfile?.debt_to_equity == null ? null : Number(companyProfile.debt_to_equity).toFixed(2)],
    ["Current ratio", companyProfile?.current_ratio == null ? null : Number(companyProfile.current_ratio).toFixed(2)],
  ].filter(([, value]) => value != null);

  function submitAlert(e) {
    e.preventDefault();
    const price = Number(alertPrice);
    if (!price) return;
    requireAuth(() => {
      addAlert(s.ticker, alertCondition, price);
      setAlertPrice("");
    });
  }

  return (
    <>
      <PageFrame title={s.ticker}>
        <button className="iv-btn-ghost sm" onClick={() => router.back()} style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="iv-grid-2">
          <div>
            <div className="iv-panel">
              <div className="iv-panel-head">
                <div className="iv-company-heading">
                  <div className="iv-company-logo" aria-hidden="true">
                    {companyProfile?.logo_url && !logoError ? (
                      <img
                        src={companyProfile.logo_url}
                        alt=""
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      s.ticker.slice(0, 2)
                    )}
                  </div>
                  <div>
                    <MarketBadge market={s.market} />
                    <h2 style={{ marginTop: 8 }}>{displayName}</h2>
                    <span className="mono muted">{s.ticker} &middot; {displaySector}</span>
                  </div>
                </div>
                <button className="iv-star-btn lg" onClick={() => requireAuth(() => toggleWatch(s.ticker))} aria-label="Toggle watchlist">
                  <Star size={18} fill={watched ? "#ffffff" : "none"} />
                </button>
              </div>
              <div className="iv-price-row lg">
                <span className="iv-price mono"><FlashValue value={s.price} render={() => formatMoney(s.price, s.currency)} /></span>
                <span className={"iv-chg " + (s.changePct >= 0 ? "pos" : "neg")}>
                  {s.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(s.changePct).toFixed(2)}%
                </span>
              </div>
              <PriceChart
                history={s.market === "NGX" ? chartHistory : s.history}
                positive={s.changePct >= 0}
                currency={s.currency}
                height={220}
                period={chartPeriod}
                loading={s.market === "NGX" && chartLoading}
                error={s.market === "NGX" && chartError}
                onPeriodChange={s.market === "NGX" ? setChartPeriod : undefined}
              />

              <div className="iv-stat-strip small">
                <Stat label="Prev close" value={formatMoney(s.prevClose, s.currency)} />
                {hasOHLC && <Stat label="Day high" value={formatMoney(s.dayHigh, s.currency)} />}
                {hasOHLC && <Stat label="Day low" value={formatMoney(s.dayLow, s.currency)} />}
                {hasOHLC && <Stat label="Open" value={formatMoney(s.openPrice, s.currency)} />}
              </div>
            </div>



            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Market news</h3><Newspaper size={16} className="muted" /></div>
              <p className="iv-sub" style={{ marginBottom: 10 }}>{s.market === "NGX" ? "Nigerian company news." : "Company news."}</p>
              <div className="iv-notif-list">
                {marketNews.slice(0, 5).map((n) => (
                  <a key={n.id} className="iv-notif-item" href={n.url} style={{ display: "block" }} target="_blank" rel="noopener noreferrer">
                    <div>{n.headline} <ExternalLink size={12} className="muted" /></div>
                    <div className="iv-sub">{n.source}</div>
                  </a>
                ))}
                {marketNews.length === 0 && <p className="iv-empty-sm">No market news available right now.</p>}
              </div>
            </div>
          </div>

          <div className="iv-col-stack">
            {s.market === "NGX" && (
              <div className="iv-panel">
                <div className="iv-panel-head"><h3>Company profile</h3></div>
                {profileLoading && <p className="iv-empty-sm">Loading company profile...</p>}
                {!profileLoading && profileError && <p className="iv-empty-sm">Company profile is unavailable right now.</p>}
                {!profileLoading && !profileError && companyProfile && (
                  <>
                    {(companyProfile.sub_sector || companyProfile.market_classification || companyProfile.nature_of_business) && (
                      <p className="iv-sub" style={{ marginTop: 14 }}>
                        {[companyProfile.sub_sector, companyProfile.market_classification, companyProfile.nature_of_business].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {profileStats.length > 0 && <div className="iv-stat-strip small iv-profile-stats">{profileStats.map(([label, value]) => <Stat key={label} label={label} value={value} />)}</div>}

                  </>
                )}
              </div>
            )}

            <div className="iv-panel">
              <div className="iv-panel-head"><h3>Price alert</h3><BellRing size={16} className="muted" /></div>
              <form onSubmit={submitAlert}>
                <div className="iv-form-row">
                  <label className="iv-field">
                    <span>Condition</span>
                    <Select
                      value={alertCondition}
                      onChange={setAlertCondition}
                      options={[{ value: "above", label: "Rises above" }, { value: "below", label: "Falls below" }]}
                    />
                  </label>
                  <label className="iv-field">
                    <span>Target price ({s.currency})</span>
                    <input type="number" step="0.01" min="0" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} placeholder={s.price.toFixed(2)} />
                  </label>
                </div>
                <button type="submit" className="iv-btn-primary full">Set alert</button>
              </form>
            </div>

            <button className={"iv-btn-ghost full" + (watched ? "" : "")} onClick={() => requireAuth(() => toggleWatch(s.ticker))} style={{ marginTop: 0 }}>
              <Star size={15} fill={watched ? "#ffffff" : "none"} /> {watched ? "Remove from watchlist" : "Add to watchlist"}
            </button>
          </div>
        </div>
      </PageFrame>
    </>
  );
}