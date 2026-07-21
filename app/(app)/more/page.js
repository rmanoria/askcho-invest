"use client";
import Link from "next/link";
import {
  ListOrdered, BellRing, Briefcase, Landmark, Repeat, Users, GraduationCap,
  Settings, Wallet, LogOut, ChevronRight
} from "lucide-react";
import { useStore } from "@/lib/store";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import Logo3D from "@/components/Logo3D";

const GROUPS = [
  {
    title: "Track",
    items: [
      { href: "/orders", label: "Orders", icon: ListOrdered },
      { href: "/alerts", label: "Alerts", icon: BellRing },
      { href: "/portfolio", label: "My Holdings", icon: Briefcase }
    ]
  },
  {
    title: "Grow",
    items: [
      { href: "/fixed-income", label: "Fixed Income", icon: Landmark },
      { href: "/auto-invest", label: "Auto-Invest", icon: Repeat },
      { href: "/wallet", label: "Wallet", icon: Wallet }
    ]
  },
  {
    title: "Community & Learning",
    items: [
      { href: "/community", label: "Community", icon: Users },
      { href: "/learn", label: "AI Investment Tutor", icon: GraduationCap }
    ]
  },
  {
    title: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: Settings }
    ]
  }
];

export default function MorePage() {
  const { logout } = useStore();

  return (
    <>
      <Topbar title="More" />
      <TickerTape />
      <div className="iv-view iv-more-view">
        <div className="iv-more-brand">
          <Logo3D size={26} />
          <span className="iv-logo-text">ASKCHO <span className="muted">Invest</span></span>
        </div>

        {GROUPS.map((group) => (
          <div key={group.title} className="iv-more-group">
            <div className="iv-eyebrow">{group.title.toUpperCase()}</div>
            <div className="iv-more-card">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="iv-more-row">
                    <span className="iv-more-row-icon"><Icon size={17} /></span>
                    <span className="iv-more-row-label">{item.label}</span>
                    <ChevronRight size={16} className="muted" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <button className="iv-more-row iv-more-signout" onClick={logout}>
          <span className="iv-more-row-icon"><LogOut size={17} /></span>
          <span className="iv-more-row-label">Sign out</span>
        </button>
      </div>
    </>
  );
}
