"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { updateSettings } from "@/lib/actions";
import { parseTime } from "@/lib/validate";

const LABELS = ["First nudge", "Second nudge", "Third nudge"];

export function TimesForm({ saved, onSaved }: { saved: string[]; onSaved: (times: string[]) => void }) {
  const [times, setTimes] = useState(saved);
  const [errors, setErrors] = useState<(string | undefined)[]>([]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = times.map(parseTime);
    const nextErrors = parsed.map((p) => (p.ok ? undefined : p.error));
    setErrors(nextErrors);
    const firstBad = nextErrors.findIndex(Boolean);
    if (firstBad >= 0) {
      event.currentTarget.querySelector<HTMLInputElement>(`#time-${firstBad}`)?.focus();
      return;
    }
    const clean = [...new Set(parsed.flatMap((p) => (p.ok ? [p.value] : [])))].sort();
    updateSettings({ reminderTimes: clean });
    setTimes(clean);
    onSaved(clean);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {times.map((time, i) => (
        <Field key={i} id={`time-${i}`} label={LABELS[i]} error={errors[i]}>
          {(control) => (
            <TextInput
              {...control}
              type="time"
              value={time}
              onChange={(e) => setTimes(times.map((t, j) => (j === i ? e.target.value : t)))}
              className="max-w-44"
            />
          )}
        </Field>
      ))}
      <Button type="submit" variant="secondary" className="self-start">
        Save times
      </Button>
    </form>
  );
}
