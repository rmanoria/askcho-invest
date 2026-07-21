"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Briefcase, Star, Menu } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Markets", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/more", label: "More", icon: Menu }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="iv-bottom-nav">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.href === "/more"
          ? MORE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))
          : pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={"iv-bottom-tab" + (active ? " active" : "")}>
            <span className="iv-bottom-tab-icon"><Icon size={20} /></span>
            <span className="iv-bottom-tab-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const MORE_ROUTES = ["/more", "/orders", "/alerts", "/fixed-income", "/auto-invest", "/community", "/learn", "/settings", "/wallet"];
