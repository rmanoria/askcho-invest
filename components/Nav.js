"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, Briefcase, Star, ListOrdered, Landmark,
  Repeat, BellRing, Users, GraduationCap, Settings, LogOut
} from "lucide-react";
import Logo3D from "./Logo3D";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/fixed-income", label: "Fixed Income", icon: Landmark },
  { href: "/auto-invest", label: "Auto-Invest", icon: Repeat },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/community", label: "Community", icon: Users },
  { href: "/learn", label: "Learn", icon: GraduationCap }
];

export default function Nav() {
  const pathname = usePathname();
  const { logout } = useStore();

  return (
    <aside className="iv-sidebar">
      <Link href="/dashboard" className="iv-logo-wrap">
        <Logo3D size={32} />
        <span className="iv-logo-text">ASKCHO <span className="muted">Invest</span></span>
      </Link>
      <nav className="iv-sidebar-links">
        {LINKS.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link key={l.href} href={l.href} className={"iv-nav-link" + (active ? " active" : "")}>
              <Icon size={16} />
              <span className="label">{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="iv-sidebar-foot">
        <Link href="/settings" className={"iv-nav-link" + (pathname === "/settings" ? " active" : "")}>
          <Settings size={16} />
          <span className="label">Settings</span>
        </Link>
        <button className="iv-nav-link" onClick={logout}>
          <LogOut size={16} />
          <span className="label">Log out</span>
        </button>
      </div>
    </aside>
  );
}
