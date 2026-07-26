"use client";
import Link from "next/link";
import { User as UserIcon, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

export default function Topbar() {
  const { state } = useStore();

  return (
    <div className="iv-topbar">
      <Link href="/dashboard" className="iv-topbar-brand" aria-label="Home">
        <Logo size={26} />
      </Link>
      <div className="iv-topbar-right">
        <div className="iv-pill"><span className="dot" /><span className="iv-pill-label">Markets live</span></div>
        <Link href="/search" className="iv-icon-btn" aria-label="Search news, markets, indices and more"><Search size={16} /></Link>
        <NotificationBell />
        <div className="iv-user-chip"><UserIcon size={14} /> {state.user && state.user.name}</div>
      </div>
    </div>
  );
}
