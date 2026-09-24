"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Settings, LogOut, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import PageFrame from "@/components/PageFrame";

const GROUPS = [
  {
    title: "Track",
    items: [
      { href: "/alerts", label: "Alerts", icon: BellRing }
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
  const { state, logout } = useStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    router.replace("/dashboard");
  }

  return (
    <>
      <PageFrame title="More" className="iv-more-view">

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

        {state.user && (
          <button className="iv-more-row iv-more-signout" onClick={handleLogout} disabled={loggingOut}>
            <span className="iv-more-row-icon"><LogOut size={17} /></span>
            <span className="iv-more-row-label">{loggingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        )}
      </PageFrame>
    </>
  );
}