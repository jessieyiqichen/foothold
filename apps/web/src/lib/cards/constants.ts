/** Names and limits for today's cards and the saved page. The database side (fh_today, fh_saved, fh_decisions) is
 *  built by another session against one contract (the lead's, 2026-11-14). */
export const TODAY_PATH = "/today";
export const SAVED_PATH = "/saved";
export const TODAY_RPC = "fh_today";
export const SAVED_RPC = "fh_saved";
export const DECISIONS_TABLE = "fh_decisions";
/** The decisions table holds one row per person and company; a new decision replaces the old one. */
export const DECISION_CONFLICT = "user_id,company_id";

/** Today's cards come in fives; the done screen follows each five. */
export const ROUND_SIZE = 5;
/** A card shows at most this many roles. */
export const MAX_ROLES_ON_CARD = 2;
/** Past this many investors, a card says how many more. */
export const MAX_INVESTORS_SHOWN = 3;
/** How long Undo is offered after a decision. */
export const UNDO_MS = 8000;

export const DECISIONS = ["saved", "reached_out", "skipped"] as const;
export type Decision = (typeof DECISIONS)[number];
export const PERSON_SOURCES = ["hn", "sec", "yc", "site"] as const;
export type PersonSource = (typeof PERSON_SOURCES)[number];
