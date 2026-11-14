// Today's cards, the saved companies and the person's decisions, read and written as that person. Row-level security
// gives each person their own decisions; fh_today and fh_saved answer for the caller only.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { DECISION_CONFLICT, DECISIONS, DECISIONS_TABLE, SAVED_RPC, TODAY_RPC, type Decision } from "./constants";
import { CARDS_COPY } from "./copy";
import { readCards, readSavedCards } from "./rows";
import type { CompanyCard, DecisionRow, SavedCard } from "./types";

export type CardsDb = Pick<SupabaseClient, "rpc" | "from">;
type Answer = { data: unknown; error: { message: string } | null };

/** Runs one request; the database refusing it and the request never arriving both end as `message`, the cause goes
 *  to the console. `read` turns the answer into the value, or undefined when it is not one. */
async function attempt<T>(what: string, message: string, request: () => PromiseLike<Answer>, read: (data: unknown) => T | undefined): Promise<Result<T>> {
  try {
    const { data, error } = await request();
    if (error) throw new Error(error.message);
    const value = read(data);
    if (value === undefined) throw new Error("the answer was not in the expected shape");
    return ok(value);
  } catch (cause) {
    console.error(`Foothold: could not ${what}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(message);
  }
}

function logDropped(source: string, dropped: number): void {
  if (dropped > 0) console.error(`Foothold: left out ${dropped} rows from ${source} that could not be read`);
}

/** The next `limit` companies for today, best first. */
export function loadToday(db: CardsDb, limit: number): Promise<Result<CompanyCard[]>> {
  return attempt(`load ${TODAY_RPC}`, CARDS_COPY.loadFailed, () => db.rpc(TODAY_RPC, { p_limit: limit }), (data) => {
    const page = readCards(data);
    if (page) logDropped(TODAY_RPC, page.dropped);
    return page?.cards;
  });
}

/** The companies the person saved or reached out to, newest first. */
export function loadSaved(db: CardsDb): Promise<Result<SavedCard[]>> {
  return attempt(`load ${SAVED_RPC}`, CARDS_COPY.savedFailed, () => db.rpc(SAVED_RPC), (data) => {
    const page = readSavedCards(data);
    if (page) logDropped(SAVED_RPC, page.dropped);
    return page?.cards;
  });
}

const isDecision = (value: unknown): value is Decision => typeof value === "string" && (DECISIONS as readonly string[]).includes(value);

/** The person's decisions made since `since` (the start of their day), to count the cards. */
export function loadDecisionsSince(db: CardsDb, since: Date): Promise<Result<DecisionRow[]>> {
  return attempt(`load ${DECISIONS_TABLE}`, CARDS_COPY.loadFailed,
    () => db.from(DECISIONS_TABLE).select("company_id, decision, decided_at").gte("decided_at", since.toISOString()),
    (data) => (Array.isArray(data)
      ? data.flatMap((row): DecisionRow[] => {
        const { company_id: id, decision, decided_at: at } = (row ?? {}) as Record<string, unknown>;
        const companyId = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id;
        return typeof companyId === "number" && isDecision(decision) && typeof at === "string" && !Number.isNaN(Date.parse(at))
          ? [{ companyId, decision, decidedAt: at }] : [];
      })
      : undefined));
}

/** Records the person's decision on a company; a later one replaces it. */
export function decide(db: CardsDb, companyId: number, decision: Decision, at: Date = new Date()): Promise<Result<null>> {
  return attempt(`save a decision in ${DECISIONS_TABLE}`, CARDS_COPY.decideFailed,
    () => db.from(DECISIONS_TABLE).upsert({ company_id: companyId, decision, decided_at: at.toISOString() }, { onConflict: DECISION_CONFLICT }),
    () => null);
}

/** Takes the person's decision on a company back. */
export function undecide(db: CardsDb, companyId: number): Promise<Result<null>> {
  return attempt(`undo a decision in ${DECISIONS_TABLE}`, CARDS_COPY.undoFailed,
    () => db.from(DECISIONS_TABLE).delete().eq("company_id", companyId),
    () => null);
}
