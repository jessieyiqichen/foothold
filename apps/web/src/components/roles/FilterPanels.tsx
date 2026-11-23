"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { DAY_CHOICES, PLACE_PICKS, type DayChoice } from "@/lib/roles/constants";
import { ROLES_COPY, showRoles } from "@/lib/roles/copy";
import { pickedTotal } from "@/lib/roles/facets";
import { daysLabel } from "@/lib/roles/filters";

export const count = (n: number | undefined) => (n === undefined ? "" : n.toLocaleString("en-US"));
export const ROW = "flex min-h-10 cursor-pointer items-center gap-3 px-1 text-sm text-ink hover:bg-wash has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus";
export const BOX = "size-4 shrink-0 accent-ink";

/** Clear and Show N roles at the foot of a panel; hidden in the phone's sheet, where each change applies at once. */
export function Foot({ onClear, onApply, total, live }: { onClear: () => void; onApply: () => void; total: number | null; live: boolean }) {
  if (live) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3">
      <Button variant="ghost" onClick={onClear}>{ROLES_COPY.clear}</Button>
      <Button onClick={onApply}>{showRoles(total)}</Button>
    </div>
  );
}

interface ChoicesProps<T extends string> {
  legend: string;
  options: readonly { id: T; label: string }[];
  picked: T[];
  counts: Map<string, number> | null;
  caption?: string;
  /** In the sheet: each tick applies at once. */
  live?: boolean;
  onApply: (picked: T[]) => void;
}

/** Kind of work and Level: real checkboxes with each option's count, picked here and applied with Show N roles. */
export function ChoicesPanel<T extends string>({ legend, options, picked, counts, caption, live = false, onApply }: ChoicesProps<T>) {
  const [draft, setDraft] = useState<T[]>(picked);
  const shown = live ? picked : draft;
  const toggle = (id: T) => {
    const next = shown.includes(id) ? shown.filter((p) => p !== id) : options.map((o) => o.id).filter((o) => o === id || shown.includes(o));
    if (live) onApply(next);
    else setDraft(next);
  };
  return (
    <fieldset>
      <legend className="mb-1 font-mono text-xs text-ink">{legend}</legend>
      {caption && <p className="mb-1 font-mono text-[11px] text-muted">{caption}</p>}
      {options.map(({ id, label }) => (
        <label key={id} className={ROW}>
          <input type="checkbox" className={BOX} checked={shown.includes(id)} onChange={() => toggle(id)} />
          <span className="flex-1">{label}</span>
          <span className="font-mono text-xs text-muted tabular-nums">{count(counts?.get(id))}</span>
        </label>
      ))}
      <Foot live={live} onClear={() => setDraft([])} onApply={() => onApply(draft)} total={counts ? pickedTotal(counts, draft) : null} />
    </fieldset>
  );
}

interface DaysProps {
  name: string;
  value: DayChoice;
  counts: Map<string, number> | null;
  live?: boolean;
  onApply: (days: DayChoice) => void;
}

const dayKey = (days: DayChoice) => (days === null ? "any" : String(days));

/** Posted: one choice, each with its count. */
export function DaysPanel({ name, value, counts, live = false, onApply }: DaysProps) {
  const [draft, setDraft] = useState<DayChoice>(value);
  const shown = live ? value : draft;
  const pick = (days: DayChoice) => (live ? onApply(days) : setDraft(days));
  return (
    <fieldset>
      <legend className="mb-1 font-mono text-xs text-ink">{ROLES_COPY.posted}</legend>
      {DAY_CHOICES.map((days) => (
        <label key={dayKey(days)} className={ROW}>
          <input type="radio" name={name} className={BOX} checked={shown === days} onChange={() => pick(days)} />
          <span className="flex-1">{daysLabel(days)}</span>
          <span className="font-mono text-xs text-muted tabular-nums">{count(counts?.get(dayKey(days)))}</span>
        </label>
      ))}
      <Foot live={live} onClear={() => setDraft(null)} onApply={() => onApply(draft)} total={counts?.get(dayKey(draft)) ?? null} />
    </fieldset>
  );
}

/** Location: a text match on the place a posting gives, with three quick picks. */
export function PlacePanel({ id, value, live = false, onApply }: { id: string; value: string; live?: boolean; onApply: (place: string) => void }) {
  const [draft, setDraft] = useState(value);
  const shown = live ? value : draft;
  const set = (place: string) => (live ? onApply(place) : setDraft(place));
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-xs text-ink">{ROLES_COPY.placeLabel}</label>
      <input id={id} type="text" value={shown} onChange={(event) => set(event.target.value)} aria-describedby={`${id}-hint`}
        onKeyDown={(event) => { if (event.key === "Enter" && !live) onApply(draft); }} className={inputClass} />
      <p id={`${id}-hint`} className="font-mono text-[11px] leading-4 text-muted">{ROLES_COPY.placeHint}</p>
      <div role="group" aria-label={ROLES_COPY.quickPicks} className="flex flex-wrap gap-2">
        {PLACE_PICKS.map((place) => (
          <button key={place} type="button" aria-pressed={shown.toLowerCase() === place.toLowerCase()} onClick={() => set(place)}
            className="min-h-9 border border-ink px-2 text-sm text-ink hover:bg-wash aria-pressed:bg-primary focus-visible:outline-3 focus-visible:outline-focus">{place}</button>
        ))}
      </div>
      <Foot live={live} onClear={() => setDraft("")} onApply={() => onApply(draft)} total={null} />
    </div>
  );
}
