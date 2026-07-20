"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = ".iv-panel, .iv-watch-card, .iv-fi-card, .iv-investor-card, .iv-stat-strip";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add("js-reveal");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll(SELECTOR));

    if (reduce) {
      els.forEach((el) => el.classList.add("rv-in"));
      return;
    }

    els.forEach((el, i) => {
      el.classList.add("rv");
      el.style.transitionDelay = Math.min(i * 45, 220) + "ms";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
