"use client";

import { FAMILIES, LEVELS } from "@/lib/profile/roles";
import type { Facets } from "@/lib/roles/facets";
import { effectiveFamilies, effectiveLevels, type ProfilePicks, type RoleFilters } from "@/lib/roles/filters";
import { ROLES_COPY } from "@/lib/roles/copy";
import type { Preset } from "@/lib/roles/landing";
import { effectiveHideYears, withHideYears } from "@/lib/roles/signalFilters";
import { ChoicesPanel, DaysPanel, PlacePanel } from "./FilterPanels";
import { SalaryPanel, VisaPanel, type PostingToggles } from "./SignalPanels";

export interface ControlsProps {
  filters: RoleFilters;
  profile: ProfilePicks;
  facets: Facets | null;
  onChange: (next: RoleFilters) => void;
  /** A landing page's locked filter (lib/roles/landing.ts): its control is hidden, it has no chip, Clear all keeps it. */
  preset?: Preset;
}

/** The filters' panels, one function each, shared by the desktop dropdowns and the phone's sheet. `live` applies
 *  each change at once (the sheet); otherwise a panel applies with its Show N roles key and then closes. */
export function kindPanel({ filters, profile, facets, onChange }: ControlsProps, live: boolean, done: () => void) {
  return (
    <ChoicesPanel legend={ROLES_COPY.kind} options={FAMILIES} picked={effectiveFamilies(filters, profile)} counts={facets?.family ?? null} live={live}
      onApply={(families) => { onChange({ ...filters, families }); done(); }} />
  );
}

export function levelPanel({ filters, profile, facets, onChange }: ControlsProps, live: boolean, done: () => void) {
  return (
    <ChoicesPanel legend={ROLES_COPY.level} caption={ROLES_COPY.levelCaption} options={LEVELS} picked={effectiveLevels(filters, profile)}
      counts={facets?.level ?? null} live={live} onApply={(levels) => { onChange({ ...filters, levels }); done(); }} />
  );
}

export function postedPanel({ filters, facets, onChange }: ControlsProps, live: boolean, done: () => void, name: string) {
  return <DaysPanel name={name} value={filters.days} counts={facets?.days ?? null} live={live} onApply={(days) => { onChange({ ...filters, days }); done(); }} />;
}

export function placePanel({ filters, onChange }: ControlsProps, live: boolean, done: () => void, id: string) {
  return <PlacePanel id={id} value={filters.place} live={live} onApply={(place) => { onChange({ ...filters, place: place.trim() }); done(); }} />;
}

export function visaPanel({ filters, onChange }: ControlsProps, live: boolean, done: () => void, name: string) {
  return <VisaPanel name={name} value={filters.visa} live={live} onApply={(visa) => { onChange({ ...filters, visa }); done(); }} />;
}

export function salaryPanel({ filters, onChange }: ControlsProps, live: boolean, done: () => void, name: string) {
  return <SalaryPanel name={name} value={filters.minSalary} live={live} onApply={(minSalary) => { onChange({ ...filters, minSalary }); done(); }} />;
}

/** The three on-off filters: hide roles needing years (its default from the profile's level), equity, 401(k). */
export function postingToggles({ filters, profile, onChange }: ControlsProps): PostingToggles {
  return {
    hideYears: effectiveHideYears(filters, profile.levels),
    yearsByDefault: filters.hideYears === null && effectiveHideYears(filters, profile.levels),
    equity: filters.equity,
    k401: filters.k401,
    onYears: (on) => onChange(withHideYears(filters, profile.levels, on)),
    onEquity: (equity) => onChange({ ...filters, equity }),
    onK401: (k401) => onChange({ ...filters, k401 }),
  };
}
