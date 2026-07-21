"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import ScrollReveal from "@/components/ScrollReveal";
import PageTransition from "@/components/PageTransition";

export default function AppLayout({ children }) {
  const { state, hydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.user) router.replace("/login");
  }, [hydrated, state.user, router]);

  if (!hydrated || !state.user) return null;

  return (
    <div className="iv-shell">
      <div className="iv-shell-aurora" aria-hidden="true">
        <span></span><span></span>
      </div>
      <div className="iv-main">
        <ScrollReveal />
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomNav />
    </div>
  );
}
