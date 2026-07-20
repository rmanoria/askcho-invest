"use client";
import { Settings as SettingsIcon, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

function monthsBack(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

export default function SettingsPage() {
  const { state, logout, notify } = useStore();
  const statements = [1, 2, 3, 4].map((n) => monthsBack(n));

  return (
    <>
      <Topbar title="Settings" />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-grid-2">
          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Profile</h3><SettingsIcon size={16} className="muted" /></div>
            <div className="iv-form-row">
              <label className="iv-field">
                <span>Full name</span>
                <input value={state.user ? state.user.name : ""} readOnly />
              </label>
            </div>
            <div className="iv-form-row">
              <label className="iv-field">
                <span>Email</span>
                <input value={state.user ? state.user.email : ""} readOnly />
              </label>
            </div>
            <button className="iv-btn-ghost" onClick={() => notify("Profile editing is a demo placeholder for now")}>Edit profile</button>
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 20, paddingTop: 16 }}>
              <button className="iv-btn-danger" onClick={logout}>Log out</button>
            </div>
          </div>

          <div className="iv-panel">
            <div className="iv-panel-head"><h3>Statements</h3><FileText size={16} className="muted" /></div>
            <p className="iv-sub" style={{ marginBottom: 12 }}>Monthly account statements for your records.</p>
            <div className="iv-tx-list">
              {statements.map((d, i) => (
                <div key={i} className="iv-tx-row">
                  <span className="iv-sub">Statement \u2014 {d.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
                  <button className="iv-btn-ghost xs" onClick={() => notify("Statement download is a demo placeholder for now")}>Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Account summary</h3></div>
          <p className="iv-sub">Member since {formatDate(Date.now())} &middot; {state.portfolio.length} holding{state.portfolio.length === 1 ? "" : "s"} &middot; {state.watchlist.length} watched</p>
        </div>
      </div>
    </>
  );
}
