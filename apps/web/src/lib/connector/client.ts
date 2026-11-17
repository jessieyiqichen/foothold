// The card's side of drafts: asking the server route for one, and loading the one already saved. The model is only
// ever called on the server, where the key is.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { DRAFT_COLUMNS, DRAFT_PATH, DRAFTS_TABLE } from "./constants";
import { DRAFT_COPY } from "./copy";
import type { Draft } from "./types";

export type DraftsDb = Pick<SupabaseClient, "from">;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const filled = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** A draft from the route's answer (camelCase) or a saved row (snake_case), or null when a field is missing. */
function readDraft(value: unknown, keys: Record<keyof Draft, string>): Draft | null {
  if (!isRecord(value)) return null;
  const fields = Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, value[key]]));
  return Object.values(fields).every(filled) ? (fields as unknown as Draft) : null;
}

const ANSWER_KEYS = { subject: "subject", body: "body", resumeQuote: "resumeQuote", companyQuote: "companyQuote", model: "model" };
const ROW_KEYS = { subject: "subject", body: "body", resumeQuote: "resume_quote", companyQuote: "company_quote", model: "model" };

export const rowToDraft = (row: unknown): Draft | null => readDraft(row, ROW_KEYS);

/** Asks the server for a draft for one company. A refusal comes back with the route's own line. */
export async function requestDraft(companyId: number, fetcher: typeof fetch = fetch): Promise<Result<Draft>> {
  try {
    const response = await fetcher(DRAFT_PATH, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: companyId }),
    });
    const answer: unknown = await response.json().catch(() => null);
    const draft = response.ok && isRecord(answer) ? readDraft(answer.draft, ANSWER_KEYS) : null;
    if (draft) return ok(draft);
    const line = isRecord(answer) && filled(answer.error) ? answer.error : null;
    if (!line) console.error(`Foothold drafts: the route answered ${response.status} in a shape the page does not know`);
    return fail(line ?? DRAFT_COPY.failed);
  } catch (cause) {
    console.error("Foothold drafts: the request did not arrive", cause);
    return fail(DRAFT_COPY.failed);
  }
}

/** The person's saved draft for a company, or null. A failed read is logged and reads as no draft, so the card still
 *  offers to write one. */
export async function loadSavedDraft(db: DraftsDb, companyId: number): Promise<Draft | null> {
  try {
    const { data, error } = await db.from(DRAFTS_TABLE).select(DRAFT_COLUMNS).eq("company_id", companyId).maybeSingle();
    if (error) throw new Error(error.message);
    return data === null ? null : rowToDraft(data);
  } catch (cause) {
    console.error(`Foothold drafts: could not load the saved draft: ${cause instanceof Error ? cause.message : String(cause)}`);
    return null;
  }
}

/** What Copy puts on the clipboard: the subject line, a blank line, the body. */
export const draftText = ({ subject, body }: { subject: string; body: string }): string => `Subject: ${subject}\n\n${body}`;
