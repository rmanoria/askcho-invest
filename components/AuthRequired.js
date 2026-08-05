"use client";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
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
          <p>You have to log in first to use this feature. Log in or create a free account to continue, or go back.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280, marginTop: 14 }}>
            <button className="iv-btn-primary full" onClick={() => router.push("/login")}>
              Log in
            </button>
            <button className="iv-btn-ghost full" onClick={() => router.push("/signup")}>
              Create account
            </button>
            <button className="iv-btn-ghost full" onClick={() => router.replace("/dashboard")}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
