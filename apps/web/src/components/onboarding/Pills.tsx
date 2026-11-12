"use client";

export interface Pill {
  value: string;
  label: string;
  /** A second, quieter part, e.g. "By Nov 18" or "5 a day". */
  detail?: string;
  /** Read out with the choice, for one that opens a field below it (screen readers only). */
  hint?: string;
}

interface Props {
  name: string;
  legend: string;
  /** The question is already asked aloud (Titi's bubble), so the legend is for screen readers only. */
  hideLegend?: boolean;
  options: Pill[];
  value: string;
  onChange: (value: string) => void;
}

/** One question as a row of one-tap answers: real radio buttons (arrow keys move between them), drawn as clay pills.
 *  The chosen one is pale green with a tick, so it never rests on colour alone. */
export function Pills({ name, legend, hideLegend = false, options, value, onChange }: Props) {
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-2 font-display text-lg font-semibold text-ink lg:mb-3 lg:text-xl"}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label
              key={o.value}
              className={`clay clay-press inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 font-display font-semibold text-ink lg:min-h-12 lg:px-5 lg:text-lg ${
                on ? "bg-primary-soft [--lip:var(--color-lip)]" : "bg-surface hover:bg-wash"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                aria-describedby={o.hint ? `${name}-${o.value}-hint` : undefined}
                className="sr-only"
              />
              {on && <span aria-hidden="true">✓</span>}
              <span>{o.label}</span>
              {o.detail && <span className="font-sans text-sm font-bold text-muted">{o.detail}</span>}
              {o.hint && <span id={`${name}-${o.value}-hint`} className="sr-only">{o.hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
