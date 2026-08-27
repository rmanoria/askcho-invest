"use client";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export default function Select({ value, onChange, options, placeholder, compact, label }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // close on outside click \u2014 the panel is portaled to <body>, so we check both
  // the trigger and the portaled panel before treating a click as "outside"
  useEffect(() => {
    function onClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        (!panelRef.current || !panelRef.current.contains(e.target))
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // position the portaled panel against the trigger's live coordinates so it always
  // renders above everything else on the page, instead of being clipped/covered by
  // whatever sibling panel happens to sit later in the layout
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    function updatePos() {
      const r = triggerRef.current.getBoundingClientRect();
      const maxW = compact ? Math.min(260, window.innerWidth * 0.8) : r.width;
      let left = r.left;
      if (compact && left + maxW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 8 - maxW);
      setPos({ top: r.bottom + 6, left, width: r.width });
    }
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open, compact]);

  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = norm.find((o) => o.value === value);

  return (
    <div className={"iv-select" + (compact ? " compact" : "")} ref={triggerRef}>
      <button type="button" className="iv-select-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="iv-select-value">
          {label && <span className="iv-select-label">{label}: </span>}
          {current ? current.label : placeholder || "Select"}
        </span>
        <ChevronDown size={15} className={"iv-select-chevron" + (open ? " open" : "")} />
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <div
          className={"iv-select-panel" + (compact ? " compact" : "")}
          role="listbox"
          ref={panelRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: compact ? "max-content" : pos.width,
            minWidth: compact ? 150 : undefined,
            maxWidth: compact ? "min(260px, 80vw)" : undefined
          }}
        >
          {norm.map((o) => (
            <button
              type="button"
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={"iv-select-option" + (o.value === value ? " active" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}