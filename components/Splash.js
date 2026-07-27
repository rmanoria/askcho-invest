"use client";
import { useEffect, useState } from "react";

export default function Splash() {
  const [stage, setStage] = useState("start"); // start -> brand -> slogan -> out
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage("brand"), 150);
    const t2 = setTimeout(() => setStage("slogan"), 1600);
    const t3 = setTimeout(() => setStage("out"), 6200);
    const t4 = setTimeout(() => setHidden(true), 6800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  if (hidden) return null;

  const brandShown = stage === "brand" || stage === "slogan" || stage === "out";
  const sloganShown = stage === "slogan" || stage === "out";

  return (
    <div className={"iv-splash" + (stage === "out" ? " out" : "")} aria-hidden="true">
      <div className="iv-splash-inner">
        <img src="/cam-logo-full.png" alt="" className={"iv-splash-logo" + (brandShown ? " show" : "")} />
        <p className={"iv-splash-slogan" + (sloganShown ? " show" : "")}>
          Master the Market. Sustain the Future
          <span className="iv-splash-dots"><i>.</i><i>.</i><i>.</i></span>
        </p>
      </div>
    </div>
  );
}