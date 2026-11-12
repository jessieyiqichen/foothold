"use client";

import { useEffect, useState } from "react";

const DURATION_MS = 700;

/** Counts from 0 up to `value` once, the way a results screen does. Instant for people who ask for less motion. */
export function useCountUp(value: number, delayMs = 0): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (still) {
        setShown(value);
        return;
      }
      if (!start) start = now;
      const t = Math.min((now - start - delayMs) / DURATION_MS, 1);
      if (t >= 0) setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delayMs]);
  return shown;
}
