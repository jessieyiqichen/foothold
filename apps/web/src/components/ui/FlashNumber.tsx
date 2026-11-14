"use client";

import { useState, type ReactNode } from "react";

/** Text that lights up in mustard for a moment when `value` changes, and not on first showing: motion only where
 *  something happened (Tape & Tile). The `flash` class stops for people who ask for reduced motion. */
export function FlashNumber({ value, children, className = "" }: { value: number; children: ReactNode; className?: string }) {
  // Adjusted while rendering, as React recommends for state that follows a prop: `changes` counts real changes
  const [seen, setSeen] = useState({ value, changes: 0 });
  if (seen.value !== value) setSeen({ value, changes: seen.changes + 1 });
  return <span key={seen.changes} className={`${seen.changes > 0 ? "flash" : ""} ${className}`}>{children}</span>;
}
