/** Names and limits for the matches page. The database side is the `fh_matches` function (supabase/, not ours). */
export const MATCHES_PATH = "/matches";
export const MATCHES_RPC = "fh_matches";
/** One page of matches, and what "Show more" adds. */
export const MATCHES_PAGE_SIZE = 50;
/** A role open in many cities is one row; past this many places the row says how many more. */
export const MAX_PLACES_SHOWN = 3;
/** The only kind of link a posting may open. */
export const POSTING_PROTOCOL = "https:";
/** What a row is read as when it names a family or a level this page does not know (a newer worker, an older page). */
export const UNKNOWN_FAMILY = "other";
export const UNKNOWN_LEVEL = "unspecified";
