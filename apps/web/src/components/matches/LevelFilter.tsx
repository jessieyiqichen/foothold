"use client";

import { useState } from "react";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { MATCHES_COPY } from "@/lib/matches/copy";
import { toggleLevel } from "@/lib/profile/directions";
import { LEVELS, type Level } from "@/lib/profile/roles";
import type { Profile, Result } from "@/lib/profile/types";

interface LevelFilterProps {
  /** The levels saved on the profile; none means every level. */
  levels: Level[];
  onChange: (levels: Level[]) => Promise<Result<Profile>>;
}

/** Which levels to show: any number, kept on the person's profile. Saved first, shown after; a failure leaves the
 *  filter and the list as they were and says so. Nothing here scrolls the page or moves focus. */
export function LevelFilter({ levels, onChange }: LevelFilterProps) {
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
      <h2 id="matches-levels" className="font-semibold text-ink">{MATCHES_COPY.levelsLegend}</h2>
      <div role="group" aria-labelledby="matches-levels" className="flex flex-wrap gap-2">
        {LEVELS.map(({ id, label }) => (
          <ToggleChip key={id} on={levels.includes(id)} onClick={() => toggle(id)}>{label}</ToggleChip>
        ))}
      </div>
      <p className="text-sm text-muted">{MATCHES_COPY.levelsNote}</p>
      {/* Always the same height, so a line coming or going never moves the list under it */}
      <div className="min-h-6">
        <p role="status" className="text-sm font-semibold text-ink">{saving ? MATCHES_COPY.savingLevels : ""}</p>
        {!saving && error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
      </div>
    </section>
  );
}
