// All roles' filters, kept in the URL so back and refresh keep them. Kind of work and level start from the person's
// profile (no key in the URL) until they are changed here; changing them here never changes the profile. An empty key
// (`kind=`) means no filter. Everything here is pure.
import { FAMILIES, LEVELS, type Family, type Level } from "../profile/roles";
import { DAY_CHOICES, DEFAULT_DAYS, MAX_TEXT, REMOTE_PLACE, ROLES_PAGE_SIZE, SORTS, type DayChoice, type Sort } from "./constants";

export interface RoleFilters {
  query: string;
  /** null: as on the profile. */
  families: Family[] | null;
  /** null: as on the profile. */
  levels: Level[] | null;
  /** null: any age. */
  days: DayChoice;
  place: string;
  sort: Sort;
}

export interface ProfilePicks {
  families: readonly Family[];
  levels: readonly Level[];
}

export const DEFAULT_FILTERS: RoleFilters = { query: "", families: null, levels: null, days: DEFAULT_DAYS, place: "", sort: "fit" };

const KEYS = { query: "q", families: "kind", levels: "level", days: "posted", place: "place", sort: "sort" } as const;
const text = (value: string | null) => (value ?? "").trim().slice(0, MAX_TEXT);

function pickList<T extends string>(raw: string | null, known: readonly { id: T }[]): T[] | null {
  if (raw === null) return null;
  const wanted = new Set(raw.split(",").map((part) => part.trim()));
  return known.map((option) => option.id).filter((id) => wanted.has(id));
}

function parseDays(raw: string | null): DayChoice {
  if (raw === "any") return null;
  const days = Number(raw);
  return (DAY_CHOICES as readonly (number | null)[]).includes(days) && raw !== null ? (days as DayChoice) : DEFAULT_DAYS;
}

export function parseFilters(params: URLSearchParams): RoleFilters {
  const sort = params.get(KEYS.sort);
  return {
    query: text(params.get(KEYS.query)),
    families: pickList(params.get(KEYS.families), FAMILIES),
    levels: pickList(params.get(KEYS.levels), LEVELS),
    days: parseDays(params.get(KEYS.days)),
    place: text(params.get(KEYS.place)),
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : "fit",
  };
}

/** The query string for the filters, with only what differs from the defaults. */
export function filtersToQuery(filters: RoleFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set(KEYS.query, filters.query);
  if (filters.families !== null) params.set(KEYS.families, filters.families.join(","));
  if (filters.levels !== null) params.set(KEYS.levels, filters.levels.join(","));
  if (filters.days !== DEFAULT_DAYS) params.set(KEYS.days, filters.days === null ? "any" : String(filters.days));
  if (filters.place) params.set(KEYS.place, filters.place);
  if (filters.sort !== "fit") params.set(KEYS.sort, filters.sort);
  return params.toString().replace(/%2C/g, ",");
}

export const effectiveFamilies = (filters: RoleFilters, profile: ProfilePicks): Family[] => [...(filters.families ?? profile.families)];
export const effectiveLevels = (filters: RoleFilters, profile: ProfilePicks): Level[] => [...(filters.levels ?? profile.levels)];

export const triggerLabel = (name: string, picked: number): string => (picked > 0 ? `${name} · ${picked}` : name);

export function isFiltering(filters: RoleFilters, profile: ProfilePicks) {
  return {
    families: effectiveFamilies(filters, profile).length > 0,
    levels: effectiveLevels(filters, profile).length > 0,
    days: filters.days !== null,
    place: filters.place !== "",
  };
}

export const applyChange = (filters: RoleFilters, change: Partial<RoleFilters>): RoleFilters => ({ ...filters, ...change });

/** Every filter off; the sort stays, since it does not filter. */
export const clearAll = (filters: RoleFilters): RoleFilters => ({ ...DEFAULT_FILTERS, families: [], levels: [], days: null, sort: filters.sort });

export const isRemote = (place: string): boolean => place.trim().toLowerCase() === REMOTE_PLACE;
export const daysLabel = (days: DayChoice): string => (days === null ? "Any time" : `Last ${days} days`);

export interface Chip {
  key: string;
  label: string;
  /** The filters with this one taken off. */
  without: RoleFilters;
}

/** What the person changed here, in the toolbar's order, each with the filters as they would be without it. The
 *  profile's own kinds of work and levels and the default 60 days are not chips: the triggers already show them, and
 *  seven chips for the defaults read as clutter (user, 2026-11-16). Any time filters nothing, so it has no chip. */
export function activeChips(filters: RoleFilters, profile: ProfilePicks): Chip[] {
  const chips: Chip[] = [];
  if (filters.query) chips.push({ key: "q", label: `“${filters.query}”`, without: { ...filters, query: "" } });
  if (filters.families !== null) {
    const families = effectiveFamilies(filters, profile);
    for (const id of families) {
      chips.push({ key: `kind-${id}`, label: FAMILIES.find((f) => f.id === id)?.label ?? id, without: { ...filters, families: families.filter((f) => f !== id) } });
    }
  }
  if (filters.levels !== null) {
    const levels = effectiveLevels(filters, profile);
    for (const id of levels) {
      chips.push({ key: `level-${id}`, label: LEVELS.find((l) => l.id === id)?.label ?? id, without: { ...filters, levels: levels.filter((l) => l !== id) } });
    }
  }
  if (filters.days !== null && filters.days !== DEFAULT_DAYS) chips.push({ key: "posted", label: daysLabel(filters.days), without: { ...filters, days: DEFAULT_DAYS } });
  if (filters.place) chips.push({ key: "place", label: isRemote(filters.place) ? "Remote" : `Place: ${filters.place}`, without: { ...filters, place: "" } });
  return chips;
}

const PLACE_TRIGGER_MAX = 16;
/** The Posted trigger names the age it keeps ("Last 60 days"), or just "Posted" when it keeps any age. */
export const postedTrigger = (days: DayChoice): string => (days === null ? "Posted" : daysLabel(days));
/** The Location trigger names the place, cut short, or just "Location" when there is none. */
export function placeTrigger(place: string): string {
  const t = place.trim();
  if (!t) return "Location";
  if (isRemote(t)) return "Remote";
  return t.length > PLACE_TRIGGER_MAX ? `${t.slice(0, PLACE_TRIGGER_MAX)}…` : t;
}

/** Every filter that narrows the list, the profile's picks included: the number on the phone's Filters button. */
export function narrowingCount(filters: RoleFilters, profile: ProfilePicks): number {
  const on = isFiltering(filters, profile);
  return effectiveFamilies(filters, profile).length + effectiveLevels(filters, profile).length + (on.days ? 1 : 0) + (on.place ? 1 : 0);
}

const placeArg = (place: string): string | null => (place.trim() ? (isRemote(place) ? REMOTE_PLACE : place.trim()) : null);

/** fh_roles_facets' arguments: null kinds of work and levels mean the profile's, read by the database itself. */
export function facetsArgs(filters: RoleFilters) {
  return {
    p_families: filters.families, p_levels: filters.levels, p_days: filters.days,
    p_query: filters.query.trim() || null, p_place: placeArg(filters.place),
  };
}

export const rolesArgs = (filters: RoleFilters, offset: number) => ({ ...facetsArgs(filters), p_sort: filters.sort, p_limit: ROLES_PAGE_SIZE, p_offset: offset });
