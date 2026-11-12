// The roles worker's pure part: what a call may ask for, what a row read from fh_postings must look like, and the
// rows handed to fh_set_roles. No Deno or Node imports. The title rules themselves are in packages/core/src/roles.ts
// and are passed in, so this file imports nothing.

export const LIMIT_DEFAULT = 500;
/** One call reads id and title only, so a batch is small. Kept well under the 1,000 rows the API returns at most, so
 *  "fewer rows than asked for" can only mean the end was reached, never a capped answer. */
export const LIMIT_MAX = 500;

export interface Posting { id: number; title: string | null }
export interface RoleRow { id: number; family: string; level: string }

/** The batch size asked for, kept inside 1..LIMIT_MAX; the default when it is not a whole number. */
export function pickLimit(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? Math.min(Math.max(value, 1), LIMIT_MAX) : LIMIT_DEFAULT;
}

/** Rows as the database returned them. A row without a whole-number id is dropped; a title that is not text is null. */
export function readPostings(data: unknown): Posting[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row: unknown): Posting[] => {
    if (typeof row !== "object" || row === null) return [];
    const { id, title } = row as { id?: unknown; title?: unknown };
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) return [];
    return [{ id, title: typeof title === "string" ? title : null }];
  });
}

/** Each posting's family and level, read from its title by the two rules given. */
export function withRoles(
  postings: readonly Posting[], familyOf: (title: string | null) => string, levelOf: (title: string | null) => string,
): RoleRow[] {
  return postings.map((p) => ({ id: p.id, family: familyOf(p.title), level: levelOf(p.title) }));
}

/** True when this call read the last unlabelled rows: fewer came back than were asked for. */
export const reachedEnd = (read: number, limit: number): boolean => read < limit;

/** The tag counts are rebuilt only by the call that labelled the last rows. The worker has no key of its own, so
 *  anyone can call it; a call that changes nothing must not start a recount of every posting, or write anything. */
export const shouldRecount = (read: number, limit: number, updated: number): boolean => reachedEnd(read, limit) && updated > 0;
