"use client";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import PageFrame from "@/components/PageFrame";

export default function SettingsPage() {
  const { state, logout, updateProfile } = useStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const parts = (state.user?.name || "").trim().split(/\s+/);
    setFirstName(parts.shift() || "");
    setLastName(parts.join(" "));
  }, [state.user]);

  async function saveProfile(event) {
    event.preventDefault();
    const saved = await updateProfile(firstName.trim(), lastName.trim());
    if (saved) setEditing(false);
  }

  return (
    <>
      <PageFrame title="Settings">
        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Profile</h3><SettingsIcon size={16} className="muted" /></div>
          <form onSubmit={saveProfile}>
            <div className="iv-form-row">
              <label className="iv-field">
                <span>First name</span>
                <input value={firstName} onChange={(event) => setFirstName(event.target.value)} readOnly={!editing} required />
              </label>
              <label className="iv-field">
                <span>Last name</span>
                <input value={lastName} onChange={(event) => setLastName(event.target.value)} readOnly={!editing} required />
              </label>
            </div>
            <label className="iv-field">
              <span>Email</span>
              <input value={state.user ? state.user.email : ""} readOnly />
            </label>
            {editing && <button className="iv-btn-primary" type="submit">Save profile</button>}
          </form>
          {!editing && <button className="iv-btn-ghost" type="button" onClick={() => setEditing(true)}>Edit profile</button>}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 20, paddingTop: 16 }}>
            <button className="iv-btn-danger" onClick={logout}>Log out</button>
          </div>
        </div>

        <div className="iv-panel">
          <div className="iv-panel-head"><h3>Account summary</h3></div>
          <p className="iv-sub">
            {state.watchlist.length} watched &middot; {state.alerts.filter((a) => a.active).length} active alert{state.alerts.filter((a) => a.active).length === 1 ? "" : "s"}
          </p>
        </div>
      </PageFrame>
    </>
  );
}
