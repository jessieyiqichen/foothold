"use client";

import { FAMILIES, LEVELS } from "@/lib/profile/roles";
import type { Facets } from "@/lib/roles/facets";
import { effectiveFamilies, effectiveLevels, type ProfilePicks, type RoleFilters } from "@/lib/roles/filters";
import { ROLES_COPY } from "@/lib/roles/copy";
import type { Preset } from "@/lib/roles/landing";
import { ChoicesPanel, DaysPanel, PlacePanel } from "./FilterPanels";

export interface ControlsProps {
  filters: RoleFilters;
  profile: ProfilePicks;
  facets: Facets | null;
  onChange: (next: RoleFilters) => void;
  /** A landing page's locked filter (lib/roles/landing.ts): its control is hidden, it has no chip, Clear all keeps it. */
  preset?: Preset;
}

/** The four filters' panels, one function each, shared by the desktop dropdowns and the phone's sheet. `live` applies
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
