"use client";
import { useEffect, useState } from "react";

export default function Splash() {
  const [phase, setPhase] = useState("in"); // in -> out
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1500);
    const t2 = setTimeout(() => setHidden(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (hidden) return null;

  return (
    <div className={"iv-splash" + (phase === "out" ? " out" : "")} aria-hidden="true">
      <img src="/cam-logo-full.png" alt="" className="iv-splash-logo show" />
    </div>
  );
}
