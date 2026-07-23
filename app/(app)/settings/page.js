"use client";
import { Settings as SettingsIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";

export default function SettingsPage() {
  const { state, logout, notify } = useStore();

  return (
    <>
      <Topbar title="Settings" />
      <TickerTape />
      <div className="iv-view">
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
          <div className="iv-panel-head"><h3>Account summary</h3></div>
          <p className="iv-sub">
            Member since {formatDate(Date.now())} &middot; {state.watchlist.length} watched &middot; {state.alerts.filter((a) => a.active).length} active alert{state.alerts.filter((a) => a.active).length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </>
  );
}
