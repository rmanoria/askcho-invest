"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const { hydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace("/dashboard");
  }, [hydrated, router]);

  return null;
}