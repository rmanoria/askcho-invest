"use client";
import Link from "next/link";
import { Search, User as UserIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import Logo from "./Logo";

export default function Topbar({ title = "", search, mobileSearchToggle }) {
  const { state } = useStore();

  return (
    <div className="iv-topbar">
      <Link href="/dashboard" className="iv-topbar-brand" aria-label="Home">
        <Logo size={38} />
      </Link>
      {title && <h1 className="iv-page-title">{title}</h1>}
      {search && <div className="iv-topbar-search">{search}</div>}
      <div className="iv-topbar-right">
        <div className="iv-pill"><span className="dot" /><span className="iv-pill-label">Markets live</span></div>
        {mobileSearchToggle}
        {/* <Link href="/search" className="iv-icon-btn" aria-label="Search news, markets, indices and more"><Search size={16} /></Link>
        <NotificationBell /> */}
        <div className="iv-user-chip"><UserIcon size={14} /> {state.user && state.user.name}</div>
      </div>
    </div>
  );
}