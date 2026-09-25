"use client";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import PageTransition from "@/components/PageTransition";
import AuthRequired from "@/components/AuthRequired";
import { AuthGateProvider } from "@/components/AuthGate";
import FloatingChat from "@/components/FloatingChat";
import { ConversationProvider } from "@/components/ConversationProvider";

// Routes that require the user to be logged in. Everything else (home/dashboard,
// markets, news, search, stock detail, more) is open to guests.
const GATED_ROUTES = ["/settings", "/ideas", "/watchlist", "/alerts", "/community", "/more"];

function isGatedRoute(pathname) {
  return GATED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export default function AppLayout({ children }) {
  const { state, hydrated } = useStore();
  const pathname = usePathname();

  if (!hydrated) return null;

  const blocked = isGatedRoute(pathname) && !state.user;

  return (
    <AuthGateProvider>
      <ConversationProvider>
        <div className="iv-shell">
          <div className="iv-shell-aurora" aria-hidden="true">
            <span></span><span></span>
          </div>
          <div className="iv-main">
            <ScrollReveal />
            <PageTransition>{blocked ? <AuthRequired /> : children}</PageTransition>
          </div>
          <FloatingChat />
          <BottomNav />
        </div>
      </ConversationProvider>
    </AuthGateProvider>
  );
}
