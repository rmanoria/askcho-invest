"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Newspaper, Star, Menu } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/more", label: "More", icon: Menu }
];

const MORE_ROUTES = ["/more", "/search", "/alerts", "/community", "/learn", "/settings", "/stock"];

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
