// The counts beside each option in the filter dropdowns, from fh_roles_facets. Each facet's counts ignore its own
// filter (data-scout's contract), so a count says how many roles that choice would show.
import { FAMILIES, LEVELS } from "../profile/roles";

export interface Facets {
  family: Map<string, number>;
  level: Map<string, number>;
  days: Map<string, number>;
}

const KNOWN: Record<keyof Facets, ReadonlySet<string>> = {
  family: new Set(FAMILIES.map((f) => f.id)),
  level: new Set(LEVELS.map((l) => l.id)),
  days: new Set(["7", "30", "60", "any"]),
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** The counts by facet and value; rows it does not know are left out. Null when the answer is not a list. */
export function readFacets(data: unknown): Facets | null {
  if (!Array.isArray(data)) return null;
  const facets: Facets = { family: new Map(), level: new Map(), days: new Map() };
  for (const row of data) {
    if (!isRecord(row)) continue;
    const { facet, value } = row;
    const n = typeof row.n === "string" && /^\d+$/.test(row.n) ? Number(row.n) : row.n;
    if (typeof facet !== "string" || !(facet in KNOWN) || typeof value !== "string") continue;
    if (!KNOWN[facet as keyof Facets].has(value) || typeof n !== "number" || !Number.isInteger(n) || n < 0) continue;
    facets[facet as keyof Facets].set(value, n);
  }
  return facets;
}

/** How many roles the picked values would show: their counts added (one kind of work and one level per role), or
 *  every value's when none is picked, since none picked is no filter. */
export function pickedTotal(counts: Map<string, number>, picked: readonly string[]): number {
  const values = picked.length > 0 ? picked : [...counts.keys()];
  return values.reduce((sum, value) => sum + (counts.get(value) ?? 0), 0);
}
