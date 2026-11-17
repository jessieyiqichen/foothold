import { RESUME_MAX } from "../drafts/generate";

/** Names and limits for the Connector's drafts (the card's "Write a draft"). The length limits repeat the checks in
 *  supabase/migrations/20261116200000_foothold_drafts.sql; change both together. */
export const DRAFT_PATH = "/api/drafts";
export const DRAFTS_TABLE = "fh_drafts";
/** Takes one of today's tries, or refuses; the database counts and locks (the drafts migration). */
export const TAKE_RUN_RPC = "fh_take_draft_run";
export const DRAFT_COLUMNS = "subject, body, resume_quote, company_quote, model";
export const DRAFT_CONFLICT = "user_id,company_id";

/** Tries a person may take since the start of the current UTC day (the free tier's model quota is shared). The number
 *  that counts is the one in fh_take_draft_run; this one says it on the page. Change both together. */
export const DAILY_DRAFT_LIMIT = 10;
/** The most resume text passed to the model: generateDraft's own limit, so the two never disagree. */
export const RESUME_CAP = RESUME_MAX;
/** The card's roles are the company's fresh ones, as on the card itself. */
export const FIT_DAYS = 60;
