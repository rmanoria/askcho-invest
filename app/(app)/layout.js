"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Nav from "@/components/Nav";

export default function AppLayout({ children }) {
  const { state, hydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.user) router.replace("/login");
  }, [hydrated, state.user, router]);

  if (!hydrated || !state.user) return null;

  return (
    <div className="iv-shell">
      <Nav />
      <div className="iv-main">{children}</div>
    </div>
  );
}
