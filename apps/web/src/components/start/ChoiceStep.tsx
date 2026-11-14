"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ToggleChip } from "@/components/ui/ToggleChip";
import type { Profile, Result } from "@/lib/profile/types";
import { START_COPY } from "@/lib/start/copy";

interface ChoiceStepProps<T extends string> {
  head: ReactNode;
  options: readonly { id: T; label: string }[];
  initial: T[];
  /** The line under the choices while the picks are still the suggestion. */
  suggestion: string | null;
  /** Under the choices whatever is picked (step 4's note on levels). */
  note?: string;
  /** A tap: the new picks, or the line saying why not. */
  toggle: (picked: T[], id: T) => Result<T[]>;
  /** Checked on Next: the line saying why not, or null. */
  check: (picked: T[]) => string | null;
  onSave: (picked: T[]) => Promise<Result<Profile>>;
}

/** Steps 3 and 4: one question answered with keys that are on or off, starting from a suggestion said to be one.
 *  Next saves and only a saved answer moves on; a failure stays here with its line. */
export function ChoiceStep<T extends string>({ head, options, initial, suggestion, note, toggle, check, onSave }: ChoiceStepProps<T>) {
  const [picked, setPicked] = useState<T[]>(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function tap(id: T) {
    const result = toggle(picked, id);
    if (result.ok) {
      setPicked(result.value);
      setTouched(true);
    }
    setError(result.ok ? null : result.message);
  }

  async function next() {
    const problem = check(picked);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    const result = await onSave(picked);
    if (!result.ok) {
      setSaving(false);
      setError(result.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {head}
      <div role="group" aria-labelledby="start-step" className="flex flex-wrap gap-x-1.5 gap-y-2.5">
        {options.map(({ id, label }) => <ToggleChip key={id} on={picked.includes(id)} onClick={() => tap(id)}>{label}</ToggleChip>)}
      </div>
      {/* Always the same height, so a line coming or going never moves the button */}
      <div className="flex min-h-12 flex-col gap-1">
        <p role="status" className="font-mono text-xs leading-5 text-ink">{suggestion && !touched ? suggestion : ""}</p>
        {note && <p className="font-mono text-xs leading-5 text-muted">{note}</p>}
        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      </div>
      <Button size="lg" className="self-start" onClick={next} disabled={saving}>{saving ? START_COPY.saving : START_COPY.next}</Button>
    </div>
  );
}
