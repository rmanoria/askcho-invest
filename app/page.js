"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const { state, hydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(state.user ? "/dashboard" : "/login");
  }, [hydrated, state.user, router]);

  return null;
}
