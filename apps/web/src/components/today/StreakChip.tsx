"use client";

import { useEffect, useState } from "react";
import { updateSettings } from "@/lib/actions";

/** Days in a row, always in the same corner of Today, like Duolingo's flame, marked with a fish treat. Only shown once
 *  there is a run. `tip`: Titi's one-time pointer at it on the second day ("Your streak lives here, 2 days!"); it stays
 *  for this visit and is marked seen, so it never comes back. */
export function StreakChip({
  days,
  tip = null,
}: {
  days: number;
  tip?: string | null;
}) {
  const [shown] = useState(tip);
  useEffect(() => {
    if (shown) updateSettings({ streakTipSeen: true });
  }, [shown]);
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="flat flex items-center gap-2 rounded-full bg-surface px-3 py-1 font-display text-base font-semibold text-ink">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative icon */}
        <img src="/cat/fish.png" alt="" aria-hidden="true" className="w-6" />
        {days}-day streak
      </p>
      {shown && (
        <p
          className="flat badge-in relative ml-2 rounded-2xl rounded-tl-sm bg-surface px-3 py-2 font-display text-sm font-semibold text-ink"
          style={{ ["--delay" as string]: "0.6s" }}
        >
          <span
            aria-hidden="true"
            className="absolute -top-2 left-3 size-0 border-x-8 border-b-8 border-x-transparent border-b-surface"
          />
          {shown}
        </p>
      )}
    </div>
  );
}
