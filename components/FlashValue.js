"use client";
import { useEffect, useRef, useState } from "react";

export default function FlashValue({ value, render, className = "" }) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(value > prevRef.current ? "up" : "down");
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 900);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={className + (flash ? " iv-flash-" + flash : "")}>
      {render ? render(value) : value}
    </span>
  );
}
