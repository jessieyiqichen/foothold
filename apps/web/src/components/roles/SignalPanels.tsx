"use client";

import { useState } from "react";
import { SALARY_CHOICES, type SalaryChoice, type VisaFilter } from "@/lib/roles/constants";
import { ROLES_COPY } from "@/lib/roles/copy";
import { salaryChoiceLabel, visaChoiceLabel } from "@/lib/roles/signalFilters";
import { BOX, Foot, ROW } from "./FilterPanels";
import { TRIGGER } from "./FilterMenu";

interface RadioProps<T> {
  legend: string;
  name: string;
  options: readonly T[];
  label: (value: T) => string;
  value: T;
  hint?: string;
  live?: boolean;
  onApply: (value: T) => void;
}

/** One choice of a few, picked here and applied with Show roles (no counts: the database gives none for these), or
 *  at once in the phone's sheet. */
function RadioPanel<T extends string | number | null>({ legend, name, options, label, value, hint, live = false, onApply }: RadioProps<T>) {
  const [draft, setDraft] = useState<T>(value);
  const shown = live ? value : draft;
  const pick = (next: T) => (live ? onApply(next) : setDraft(next));
  return (
    <fieldset>
      <legend className="mb-1 font-mono text-xs text-ink">{legend}</legend>
      {hint && <p className="mb-1 font-mono text-[11px] leading-4 text-muted">{hint}</p>}
      {options.map((option) => (
        <label key={String(option)} className={ROW}>
          <input type="radio" name={name} className={BOX} checked={shown === option} onChange={() => pick(option)} />
          <span className="flex-1">{label(option)}</span>
        </label>
      ))}
      <Foot live={live} onClear={() => setDraft(options[0])} onApply={() => onApply(draft)} total={null} />
    </fieldset>
  );
}

const VISA_OPTIONS: readonly (VisaFilter | null)[] = [null, "sponsors", "not_citizens_only"];
const SALARY_OPTIONS: readonly SalaryChoice[] = [null, ...SALARY_CHOICES];

export function VisaPanel(props: { name: string; value: VisaFilter | null; live?: boolean; onApply: (visa: VisaFilter | null) => void }) {
  return <RadioPanel legend={ROLES_COPY.visa} options={VISA_OPTIONS} label={visaChoiceLabel} {...props} />;
}

export function SalaryPanel(props: { name: string; value: SalaryChoice; live?: boolean; onApply: (salary: SalaryChoice) => void }) {
  return <RadioPanel legend={ROLES_COPY.minSalary} hint={ROLES_COPY.salaryHint} options={SALARY_OPTIONS} label={salaryChoiceLabel} {...props} />;
}

export interface PostingToggles {
  hideYears: boolean;
  /** The years filter is left to the profile's level, which turns it on. */
  yearsByDefault: boolean;
  equity: boolean;
  k401: boolean;
  onYears: (on: boolean) => void;
  onEquity: (on: boolean) => void;
  onK401: (on: boolean) => void;
}

/** A filter that is on or off, applied at once: a key like the dropdowns' triggers, pressed in when on, with a tick so
 *  it never rests on colour alone. */
function ToggleKey({ label, on, onToggle, describedBy }: { label: string; on: boolean; onToggle: () => void; describedBy?: string }) {
  return (
    <button type="button" aria-pressed={on} aria-describedby={describedBy} onClick={onToggle}
      className={`${TRIGGER} ${on ? "border-ink bg-wash" : "bg-surface hover:bg-wash"}`}>
      {on && <span aria-hidden="true">✓</span>}
      {label}
    </button>
  );
}

/** The three on-off filters as keys in the toolbar's second row (from 640px). */
export function ToggleKeys({ hideYears, yearsByDefault, equity, k401, onYears, onEquity, onK401 }: PostingToggles) {
  return (
    <>
      <ToggleKey label={ROLES_COPY.hideYears} on={hideYears} onToggle={() => onYears(!hideYears)} describedBy={yearsByDefault ? "roles-years-default" : undefined} />
      {yearsByDefault && <span id="roles-years-default" className="font-mono text-[11px] text-muted">{ROLES_COPY.yearsDefault}</span>}
      <ToggleKey label={ROLES_COPY.equity} on={equity} onToggle={() => onEquity(!equity)} />
      <ToggleKey label={ROLES_COPY.k401} on={k401} onToggle={() => onK401(!k401)} />
    </>
  );
}

/** The same three in the phone's sheet, as checkboxes applied at once. */
export function ToggleChecks({ hideYears, yearsByDefault, equity, k401, onYears, onEquity, onK401 }: PostingToggles) {
  const box = (label: string, on: boolean, set: (on: boolean) => void, hint?: string) => (
    <label className={ROW}>
      <input type="checkbox" className={BOX} checked={on} onChange={() => set(!on)} />
      <span className="flex flex-1 flex-col">
        {label}
        {hint && <span className="font-mono text-[11px] leading-4 text-muted">{hint}</span>}
      </span>
    </label>
  );
  return (
    <fieldset>
      <legend className="mb-1 font-mono text-xs text-ink">{ROLES_COPY.postingSays}</legend>
      <p className="mb-1 font-mono text-[11px] leading-4 text-muted">{ROLES_COPY.postingCaption}</p>
      {box(ROLES_COPY.hideYears, hideYears, onYears, yearsByDefault ? ROLES_COPY.yearsDefault : undefined)}
      {box(ROLES_COPY.equity, equity, onEquity)}
      {box(ROLES_COPY.k401, k401, onK401)}
    </fieldset>
  );
}
