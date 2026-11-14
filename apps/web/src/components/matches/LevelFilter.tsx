"use client";

import { useState, type ReactNode } from "react";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { MATCHES_COPY } from "@/lib/matches/copy";
import { toggleLevel } from "@/lib/profile/directions";
import { LEVELS, type Level } from "@/lib/profile/roles";
import type { Profile, Result } from "@/lib/profile/types";

interface LevelFilterProps {
  /** The levels saved on the profile; none means every level. */
  levels: Level[];
  onChange: (levels: Level[]) => Promise<Result<Profile>>;
  /** Shown on the same line as the levels where the width allows, under them where it does not (the count). */
  aside?: ReactNode;
}

/** Which levels to show: any number, kept on the person's profile. Saved first, shown after; a failure leaves the
 *  filter and the list as they were and says so. Nothing here scrolls the page or moves focus. */
export function LevelFilter({ levels, onChange, aside }: LevelFilterProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(level: Level) {
    if (saving) return;
    setSaving(true);
    setError(null);
    const result = await onChange(toggleLevel(levels, level));
    setSaving(false);
    if (!result.ok) setError(result.message);
  }

  return (
    <section aria-labelledby="matches-levels" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="matches-levels" className="font-mono text-xs text-ink">{MATCHES_COPY.levelsLegend}</h2>
          <div role="group" aria-labelledby="matches-levels" className="flex flex-wrap gap-x-1.5 gap-y-2.5">
            {LEVELS.map(({ id, label }) => (
              <ToggleChip key={id} on={levels.includes(id)} onClick={() => toggle(id)}>{label}</ToggleChip>
            ))}
          </div>
        </div>
        {aside}
      </div>
      <p className="font-mono text-[11px] leading-5 text-muted">{MATCHES_COPY.levelsNote}</p>
      {/* Always the same height, so a line coming or going never moves the list under it */}
      <div className="min-h-5">
        <p role="status" className="font-mono text-xs text-ink">{saving ? MATCHES_COPY.savingLevels : ""}</p>
        {!saving && error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      </div>
    </section>
  );
}
