// The signed-in person's matches, asked for as that person: `fh_matches` ranks and de-duplicates in the database
// and answers only for the caller's own profile.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { MATCHES_PAGE_SIZE, MATCHES_RPC } from "./constants";
import { MATCHES_COPY } from "./copy";
import { readMatches } from "./rows";
import type { MatchesPage } from "./types";

export type MatchesDb = Pick<SupabaseClient, "rpc">;

/** What went wrong goes to the console for whoever debugs it; the person gets a line saying what to do. */
function report(detail: string): void {
  console.error(`Foothold: could not load matches from ${MATCHES_RPC}: ${detail}`);
}

/** One page of matches, starting `offset` rows in. The database refusing, the request never arriving and an answer
 *  that is not a list all end as the same line to show. */
export async function loadMatches(db: MatchesDb, offset: number): Promise<Result<MatchesPage>> {
  if (!Number.isInteger(offset) || offset < 0) return fail(MATCHES_COPY.loadFailed);
  try {
    const { data, error } = await db.rpc(MATCHES_RPC, { p_limit: MATCHES_PAGE_SIZE, p_offset: offset });
    if (error) {
      report(error.message);
      return fail(MATCHES_COPY.loadFailed);
    }
    const page = readMatches(data);
    if (!page) {
      report("the answer was not a list of rows");
      return fail(MATCHES_COPY.loadFailed);
    }
    if (page.dropped > 0) console.error(`Foothold: left out ${page.dropped} rows from ${MATCHES_RPC} that could not be read or had no https link`);
    return ok(page);
  } catch (cause) {
    report(cause instanceof Error ? cause.message : String(cause));
    return fail(MATCHES_COPY.loadFailed);
  }
}

/** The rows shown so far with the next page after them. A role already shown is not shown twice (the list can move
 *  between two requests); the count is the newer one. */
export function addPage(shown: MatchesPage, next: MatchesPage): MatchesPage {
  const seen = new Set(shown.matches.map((match) => match.id));
  return {
    matches: [...shown.matches, ...next.matches.filter((match) => !seen.has(match.id))],
    total: next.total,
    dropped: shown.dropped + next.dropped,
  };
}

/** Whether "Show more" has anything to bring: `asked` is how many rows have been asked for so far. */
export const hasMore = ({ asked, total }: { asked: number; total: number }): boolean => asked < total;
