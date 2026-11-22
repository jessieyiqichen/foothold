"use client";

import { useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { PUBLIC_COPY } from "@/lib/public/copy";
import { loadStats, type Stats } from "@/lib/public/remote";

/** The live numbers on the signed-out Jobs page (borrowed from fastaijobs, user 2026-11-21): open roles, added this
 *  week, companies hiring. If they don't load, a quiet line says so and the list below still shows. */
export function NumbersStrip({ withDb }: { withDb: WithDb }) {
  const [stats, setStats] = useState<Stats | "failed" | null>(null);
  useEffect(() => {
    let live = true;
    withDb(PUBLIC_COPY.statsFailed, loadStats).then((r) => {
      if (live) setStats(r.ok ? r.value : "failed");
    });
    return () => {
      live = false;
    };
  }, [withDb]);

  if (stats === "failed") return <p className="font-mono text-xs text-muted">{PUBLIC_COPY.statsFailed}</p>;
  const cells: [number | null, string, string][] = [
    [stats?.openRoles ?? null, PUBLIC_COPY.openRoles, "bg-surface"],
    [stats?.addedWeek ?? null, PUBLIC_COPY.addedWeek, "bg-tile-mustard"],
    [stats?.hiringCompanies ?? null, PUBLIC_COPY.hiringCompanies, "bg-wash"],
  ];
  return (
    <div role="group" aria-label="Live numbers" className="grid grid-cols-3 border-2 border-ink">
      {cells.map(([n, label, tone], i) => (
        <div key={label} className={`flex flex-col gap-1 px-3 py-3 sm:px-5 ${tone} ${i > 0 ? "border-l-2 border-ink" : ""}`}>
          <p className="text-2xl leading-none font-black tracking-[-0.03em] text-ink tabular-nums sm:text-4xl">{n === null ? "–" : n.toLocaleString("en-US")}</p>
          <p className="font-mono text-[11px] leading-4 text-ink">{label}</p>
        </div>
      ))}
    </div>
  );
}
