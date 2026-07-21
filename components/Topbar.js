"use client";
import { useState } from "react";
import Link from "next/link";
import { User as UserIcon, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatNGN } from "@/lib/format";
import NotificationBell from "./NotificationBell";
import FundingModal from "./FundingModal";
import CountUp from "./CountUp";

export default function Topbar({ title }) {
  const { state } = useStore();
  const [fundingOpen, setFundingOpen] = useState(false);

  return (
    <div className="iv-topbar">
      <h1 className="iv-page-title">{title}</h1>
      <div className="iv-topbar-right">
        <div className="iv-pill"><span className="dot" /><span className="iv-pill-label">Markets live</span></div>
        <button className="iv-cash-chip mono" onClick={() => setFundingOpen(true)}><CountUp value={state.cash} format={formatNGN} /></button>
        <Link href="/search" className="iv-icon-btn" aria-label="Search"><Search size={16} /></Link>
        <NotificationBell />
        <div className="iv-user-chip"><UserIcon size={14} /> {state.user && state.user.name}</div>
      </div>
      {fundingOpen && <FundingModal onClose={() => setFundingOpen(false)} />}
    </div>
  );
}
