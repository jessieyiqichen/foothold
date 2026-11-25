// A role's posting text on its page (user, 2026-11-23): read for "What they ask for", shown whole on demand, with the
// warning's sentence marked where it appears. A signed-in person reads fh_postings directly (row-level security:
// authenticated read); a signed-out visitor cannot, and sees a link to the original posting instead.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { ROLE_PAGE_COPY } from "./pageCopy";

export const POSTINGS_TABLE = "fh_postings";

export interface Posting {
  /** Plain text, lines split by "\n" (the jobs worker strips the HTML); "" when none was saved. */
  text: string;
  location: string | null;
}

export interface Segment {
  text: string;
  marked: boolean;
}

/** The text in pieces, the quote's first word-for-word appearance marked; one unmarked piece when it is not there. */
export function highlight(text: string, quote: string | null): Segment[] {
  const at = quote ? text.indexOf(quote) : -1;
  if (!quote || at === -1) return [{ text, marked: false }];
  const pieces: Segment[] = [
    { text: text.slice(0, at), marked: false },
    { text: quote, marked: true },
    { text: text.slice(at + quote.length), marked: false },
  ];
  return pieces.filter((piece) => piece.text.length > 0);
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The row as the page uses it, or null when a field is of the wrong type. */
export function readPosting(data: unknown): Posting | null {
  if (!isRecord(data)) return null;
  const { text, location } = data;
  if (!(text === null || typeof text === "string") || !(location === null || location === undefined || typeof location === "string")) return null;
  return { text: text ?? "", location: typeof location === "string" && location.trim() ? location.trim() : null };
}

/** One posting's text and place, read as the person; null when there is no such posting (or it is not readable). */
export async function loadPosting(db: Pick<SupabaseClient, "from">, roleId: number): Promise<Result<Posting | null>> {
  try {
    const { data, error } = await db.from(POSTINGS_TABLE).select("text, location").eq("id", roleId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data === null) return ok(null);
    const posting = readPosting(data);
    if (!posting) throw new Error("the posting was not in the expected shape");
    return ok(posting);
  } catch (cause) {
    console.error(`Foothold: could not read posting ${roleId}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(ROLE_PAGE_COPY.postingFailed);
  }
}
