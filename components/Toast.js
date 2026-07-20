"use client";
import { useStore } from "@/lib/store";

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return <div className="iv-toast">{toast}</div>;
}
