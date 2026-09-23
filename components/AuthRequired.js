"use client";
import { useRouter } from "next/navigation";
import { BellRing, Lock, Sparkles, Star } from "lucide-react";
import Topbar from "./Topbar";
import TickerTape from "./TickerTape";

export default function AuthRequired({ title = "Log in required" }) {
  const router = useRouter();

  return (
    <>
      <Topbar title={title} />
      <TickerTape />
      <div className="iv-view">
        <div className="iv-panel iv-empty-state">
          <Lock size={26} className="muted" />
          <h3>Log in required</h3>
          <div className="iv-auth-features iv-auth-required-features">
            <div className="iv-auth-feature"><BellRing size={16} aria-hidden="true" /><span>Get notified when prices move</span></div>
            <div className="iv-auth-feature"><Star size={16} aria-hidden="true" /><span>Track favorite stocks in one place</span></div>
            <div className="iv-auth-feature"><Sparkles size={16} aria-hidden="true" /><span>Get AI context for market decisions</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280, marginTop: 14 }}>
            <button className="iv-btn-primary full" onClick={() => router.push("/login")}>
              Log in
            </button>
            <button className="iv-btn-ghost full" onClick={() => router.push("/signup")}>
              Create account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
