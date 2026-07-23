"use client";
import Link from "next/link";
import { User as UserIcon, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import NotificationBell from "./NotificationBell";
import Logo3D from "./Logo3D";

export default function Topbar({ title }) {
  const { state } = useStore();

  return (
    <div className="iv-topbar">
      <Link href="/dashboard" className="iv-topbar-brand" aria-label="ASKCHO Invest home">
        <Logo3D size={40} />
        <h1 className="iv-page-title">{title}</h1>
      </Link>
      <div className="iv-topbar-right">
        <div className="iv-pill"><span className="dot" /><span className="iv-pill-label">Markets live</span></div>
        <Link href="/search" className="iv-icon-btn" aria-label="Search"><Search size={16} /></Link>
        <NotificationBell />
        <div className="iv-user-chip"><UserIcon size={14} /> {state.user && state.user.name}</div>
      </div>
    </div>
  );
}
