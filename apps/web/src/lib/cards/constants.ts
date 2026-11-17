/** Names and limits for today's cards and the saved page. The database side (fh_today, fh_saved, fh_decisions) is
 *  built by another session against one contract (the lead's, 2026-11-14). */
export const TODAY_PATH = "/today";
export const SAVED_PATH = "/saved";
export const TODAY_RPC = "fh_today";
export const SAVED_RPC = "fh_saved";
export const DECISIONS_TABLE = "fh_decisions";
/** The decisions table holds one row per person and company; a new decision replaces the old one. */
export const DECISION_CONFLICT = "user_id,company_id";

/** The one host a founders link may point to: the company's page in the YC directory. */
export const FOUNDERS_HOST = "www.ycombinator.com";

/** Today's cards come in fives; the done screen follows each five. */
export const ROUND_SIZE = 5;
/** A card shows at most this many roles. */
export const MAX_ROLES_ON_CARD = 2;
/** Past this many investors, a card says how many more. */
export const MAX_INVESTORS_SHOWN = 3;
/** VC board lists (fh_companies.lists) by their full names. A list not here is shown as stored. */
export const INVESTOR_NAMES: Readonly<Record<string, string>> = {
  accel: "Accel", "general-catalyst": "General Catalyst", insight: "Insight Partners", "8vc": "8VC", khosla: "Khosla Ventures",
  lux: "Lux Capital", menlo: "Menlo Ventures", thrive: "Thrive Capital", notable: "Notable Capital",
};
/** Stage codes from the VC boards and YC in plain words; null leaves the stage off the card. A code not here is
 *  shown as stored. */
export const STAGE_WORDS: Readonly<Record<string, string | null>> = {
  pre_seed: "Pre-seed", seed: "Seed", series_a: "Series A", series_b: "Series B", series_c: "Series C", series_c_plus: "Series C+",
  series_d: "Series D", series_e: "Series E", series_f: "Series F", series_g: "Series G", series_h: "Series H", series_j: "Series J",
  ipo: "Public company", acquisition: "Acquired", private_equity: "Backed by private equity",
  other: null, series_unknown: null, undisclosed: null,
  Early: "Early stage", Growth: "Growth stage",
};
/** How long Undo is offered after a decision. */
export const UNDO_MS = 8000;

export const DECISIONS = ["saved", "reached_out", "skipped"] as const;
export type Decision = (typeof DECISIONS)[number];
export const PERSON_SOURCES = ["hn", "sec", "yc", "site"] as const;
export type PersonSource = (typeof PERSON_SOURCES)[number];
