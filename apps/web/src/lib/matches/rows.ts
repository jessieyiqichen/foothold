// Rows from `fh_matches`, checked before use: the page shows nothing it has not read field by field, and a posting's
// link is only ever https.
import { FAMILIES, LEVELS, type Family, type Level } from "../profile/roles";
import { POSTING_PROTOCOL, UNKNOWN_FAMILY, UNKNOWN_LEVEL } from "./constants";
import type { Match, MatchesPage } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

const familyOf = (id: string): Family => FAMILIES.find((family) => family.id === id)?.id ?? UNKNOWN_FAMILY;
const levelOf = (id: string): Level => LEVELS.find((level) => level.id === id)?.id ?? UNKNOWN_LEVEL;

/** The link if it is a full https address, else null: no http, no script, nothing relative. */
function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).protocol === POSTING_PROTOCOL ? value : null;
  } catch {
    return null;
  }
}

/** A row as the page uses it, or null when a field is missing, of the wrong type, or the link is not https. */
export function rowToMatch(row: unknown): Match | null {
  if (!isRecord(row)) return null;
  const { id, title, company_name: company, locations, posted_at: postedAt, family, level, shared, score } = row;
  const url = httpsUrl(row.url);
  if (!(typeof id === "string" || typeof id === "number") || typeof title !== "string" || title.trim() === "" || !url) return null;
  if (!(company === null || typeof company === "string") || !(locations === null || isStrings(locations))) return null;
  if (!(postedAt === null || (typeof postedAt === "string" && !Number.isNaN(Date.parse(postedAt))))) return null;
  if (typeof family !== "string" || typeof level !== "string" || !isStrings(shared) || typeof score !== "number") return null;
  return {
    id: String(id), title: title.trim(), companyName: company, url,
    locations: (locations ?? []).map((place) => place.trim()).filter(Boolean),
    postedAt, family: familyOf(family), level: levelOf(level), shared: [...shared], score,
  };
}

/** One answer from `fh_matches`: the readable rows in the order given, the count of all matches, and how many rows
 *  were dropped. Null when the answer is not a list. */
export function readMatches(data: unknown): MatchesPage | null {
  if (!Array.isArray(data)) return null;
  const matches = data.map(rowToMatch).filter((match): match is Match => match !== null);
  const totals = data.map((row) => (isRecord(row) ? row.total : null)).filter((total): total is number => Number.isInteger(total) && (total as number) >= 0);
  return { matches, total: Math.max(totals[0] ?? 0, matches.length), dropped: data.length - matches.length };
}
