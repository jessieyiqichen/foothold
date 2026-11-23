// The internship, new-grad and remote pages on Jobs (user, 2026-11-22): each is the Jobs list with one filter locked,
// at its own URL. The locked filter is not shown, has no chip, survives Clear all, and a URL that tries to change it is
// ignored; every other filter works as on Jobs. Everything here is pure.
import type { Metadata } from "next";
import type { Level } from "../profile/roles";
import { LANDING_PATH, REMOTE_PLACE } from "./constants";
import { activeChips, clearAll, filtersToQuery, narrowingCount, type Chip, type ProfilePicks, type RoleFilters } from "./filters";

/** The filter a page locks: the level, or the place. */
export type Preset = { field: "levels"; value: Level[] } | { field: "place"; value: string };

export interface LandingPage {
  id: "internships" | "new-grad" | "remote";
  path: string;
  title: string;
  /** One plain line under the title: what the list is, and where the locked filter comes from. */
  line: string;
  /** The quick link's label on Jobs. */
  chip: string;
  /** For sharing and search. */
  metaTitle: string;
  description: string;
  preset: Preset;
}

const SOURCES = "from company job boards and Hacker News hiring posts";
const page = (p: Omit<LandingPage, "metaTitle">): LandingPage => ({ ...p, metaTitle: `${p.title} · Foothold` });

/** No full stops (landing.test.ts). */
export const LANDING_PAGES: readonly LandingPage[] = [
  page({
    id: "internships", path: LANDING_PATH.internships, title: "Internships", chip: "Internships",
    line: "Internships, co-ops and fellowships at startups, read from the job title",
    description: `Open internships, co-ops and fellowships at startups, ${SOURCES}`,
    preset: { field: "levels", value: ["intern"] },
  }),
  page({
    id: "new-grad", path: LANDING_PATH.newGrad, title: "New grad roles", chip: "New grad",
    line: "New grad and junior roles at startups, read from the job title",
    description: `Open new grad and junior roles at startups, ${SOURCES}`,
    preset: { field: "levels", value: ["entry"] },
  }),
  page({
    id: "remote", path: LANDING_PATH.remote, title: "Remote roles", chip: "Remote",
    line: "Roles at startups whose location says remote, anywhere or distributed",
    description: `Open remote roles at startups, ${SOURCES}`,
    preset: { field: "place", value: REMOTE_PLACE },
  }),
];

/** What the quick links on Jobs and the way back from a landing page say. No full stops. */
export const LANDING_COPY = {
  browse: "Browse",
  back: "← All jobs",
} as const;

export type LandingId = LandingPage["id"];
export { LANDING_PATHS } from "./constants";

export const landingById = (id: LandingId): LandingPage => LANDING_PAGES.find((p) => p.id === id) ?? LANDING_PAGES[0];
/** The page at exactly this path; nothing else under /jobs is one. */
export const landingByPath = (path: string): LandingPage | null => LANDING_PAGES.find((p) => p.path === path) ?? null;

/** The page's title and description, for search and for a shared link. */
export function landingMetadata(id: LandingId): Metadata {
  const { metaTitle: title, description } = landingById(id);
  return { title, description, openGraph: { title, description } };
}

/** The filters with the preset on top, whatever the URL said about that one. */
export function lockedFilters(filters: RoleFilters, preset: Preset | undefined): RoleFilters {
  if (!preset) return filters;
  return preset.field === "levels" ? { ...filters, levels: [...preset.value] } : { ...filters, place: preset.value };
}

/** The locked filter as if never set: left to the profile (level) or empty (place). */
function unset(filters: RoleFilters, preset: Preset): RoleFilters {
  return preset.field === "levels" ? { ...filters, levels: null } : { ...filters, place: "" };
}

/** The query string to write: the preset is the page's own, so it stays out of the URL. */
export const lockedQuery = (filters: RoleFilters, preset: Preset | undefined): string =>
  filtersToQuery(preset ? unset(filters, preset) : filters);

/** Which of Level and Location the page hides, in the toolbar and in the phone's sheet. */
export const hiddenControls = (preset: Preset | undefined) => ({ levels: preset?.field === "levels", place: preset?.field === "place" });

/** Jobs' chips without one for the preset; taking any chip off keeps the preset. */
export function lockedChips(filters: RoleFilters, profile: ProfilePicks, preset: Preset | undefined): Chip[] {
  if (!preset) return activeChips(filters, profile);
  return activeChips(unset(filters, preset), profile).map((chip) => ({ ...chip, without: lockedFilters(chip.without, preset) }));
}

/** Clear all, keeping the preset (and, as on Jobs, the sort). */
export const lockedClearAll = (filters: RoleFilters, preset: Preset | undefined): RoleFilters => lockedFilters(clearAll(filters), preset);

/** The phone's Filters count without the preset. On a level page the profile's levels do not apply, so they are not
 *  counted either. */
export function lockedNarrowing(filters: RoleFilters, profile: ProfilePicks, preset: Preset | undefined): number {
  if (!preset) return narrowingCount(filters, profile);
  return narrowingCount(preset.field === "levels" ? { ...filters, levels: [] } : { ...filters, place: "" }, profile);
}
