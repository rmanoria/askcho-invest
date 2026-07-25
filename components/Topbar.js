"use client";
import { User as UserIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import NotificationBell from "./NotificationBell";

export default function Topbar() {
  const { state } = useStore();

  return (
    <div className="iv-topbar">
      <div className="iv-pill"><span className="dot" /><span className="iv-pill-label">Markets live</span></div>
      <div className="iv-topbar-right">
        <NotificationBell />
        <div className="iv-user-chip"><UserIcon size={14} /> {state.user && state.user.name}</div>
      </div>
    </div>
  );
}