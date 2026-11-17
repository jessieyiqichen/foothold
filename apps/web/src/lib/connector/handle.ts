// POST /api/drafts, as logic the tests can run: the route (app/api/drafts/route.ts) passes in the signed-in person's
// database client, the request body, the server's key and the real generateDraft. Every read and write is made with
// the person's own token, so row-level security decides what they reach; the model sees only their own resume.
import type { SupabaseClient } from "@supabase/supabase-js";
import { DAILY_DRAFT_LIMIT, DRAFT_CONFLICT, DRAFT_RUNS_TABLE, DRAFTS_TABLE, FIT_DAYS, RESUME_CAP } from "./constants";
import { DRAFT_COPY } from "./copy";
import type { Draft, DraftFailure, DraftInput, Generate } from "./types";

export type HandleDb = Pick<SupabaseClient, "from" | "rpc">;

export interface HandleDeps {
  db: HandleDb;
  userId: string;
  body: unknown;
  apiKey: string | undefined;
  generate: Generate;
  now: Date;
}

export type DraftAnswer = { status: number; body: { draft: Draft } | { error: string } };

const refuse = (status: number, error: string): DraftAnswer => ({ status, body: { error } });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

/** The company id from the body: a positive whole number, sent as a number or as digits. */
export function parseCompanyId(body: unknown): number | null {
  if (!isRecord(body)) return null;
  const raw = body.company_id;
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : raw;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Midnight UTC at the start of `now`'s day: the daily limit counts from here, the same for everyone. */
export const utcDayStart = (now: Date): Date => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const FAILURES: Record<DraftFailure, [number, string]> = {
  rate_limited: [429, DRAFT_COPY.busy],
  unavailable: [503, DRAFT_COPY.unavailable],
  unverified: [422, DRAFT_COPY.unverified],
  bad_input: [422, DRAFT_COPY.badInput],
};

class ReadFailed extends Error {}

/** Throws ReadFailed, logged with what failed, when the database refused; the person only sees readFailed. */
function check<T>(what: string, answer: { data: T; error: { message: string } | null }): T {
  if (answer.error) {
    console.error(`Foothold drafts: could not read ${what}: ${answer.error.message}`);
    throw new ReadFailed(what);
  }
  return answer.data;
}

/** The model's input: the person's resume (capped), the company's own words, the card's roles and its person. Null
 *  when there is no resume or no such company, with the answer to give. */
async function gather(db: HandleDb, userId: string, companyId: number): Promise<DraftInput | DraftAnswer> {
  const profile = check("the profile", await db.from("fh_profiles").select("resume_text").eq("user_id", userId).maybeSingle());
  const resume = isRecord(profile) ? text(profile.resume_text) : null;
  if (!resume) return refuse(409, DRAFT_COPY.noResume);
  const company = check("the company", await db.from("fh_companies").select("name, one_liner, description").eq("id", companyId).maybeSingle());
  if (!isRecord(company) || !text(company.name)) return refuse(404, DRAFT_COPY.badCompany);
  const fit = check("the company's roles", await db.rpc("fh_company_fit", { p_days: FIT_DAYS, p_companies: [companyId] }));
  const person = check("the company's person", await db.rpc("fh_company_person", { p_company: companyId }));
  const roles = (Array.isArray(fit) ? fit : []).flatMap((row) => (isRecord(row) && Array.isArray(row.roles) ? row.roles : []))
    .flatMap((role) => (isRecord(role) && text(role.title) ? [{ title: (role.title as string).trim() }] : []));
  return {
    resumeText: resume.slice(0, RESUME_CAP),
    company: { name: (company.name as string).trim(), oneLiner: text(company.one_liner), description: text(company.description) },
    roles,
    person: isRecord(person) ? { name: text(person.name), role: text(person.role) } : null,
  };
}

/** Whether the person may write another draft today; records the run when they may. */
async function takeRun(db: HandleDb, companyId: number, now: Date): Promise<boolean> {
  const counted = await db.from(DRAFT_RUNS_TABLE).select("at", { count: "exact", head: true }).gte("at", utcDayStart(now).toISOString());
  check("today's drafts", counted);
  if ((counted.count ?? 0) >= DAILY_DRAFT_LIMIT) return false;
  check("a new run", await db.from(DRAFT_RUNS_TABLE).insert({ company_id: companyId }));
  return true;
}

/** Keeps the draft for the card to load next time. A failure here is logged, and the person still gets the draft. */
async function keep(db: HandleDb, companyId: number, draft: Draft): Promise<void> {
  const row = { company_id: companyId, subject: draft.subject, body: draft.body, resume_quote: draft.resumeQuote, company_quote: draft.companyQuote, model: draft.model };
  const { error } = await db.from(DRAFTS_TABLE).upsert(row, { onConflict: DRAFT_CONFLICT });
  if (error) console.error(`Foothold drafts: could not save the draft: ${error.message}`);
}

/** POST /api/drafts: refuses what it must before the model is called, counts the run, writes, keeps, answers. */
export async function handleDraftRequest(signedIn: Pick<HandleDeps, "db" | "userId"> | null, deps: Omit<HandleDeps, "db" | "userId">): Promise<DraftAnswer> {
  if (!signedIn) return refuse(401, DRAFT_COPY.signedOut);
  const companyId = parseCompanyId(deps.body);
  if (companyId === null) return refuse(400, DRAFT_COPY.badCompany);
  if (!deps.apiKey) {
    console.error("Foothold drafts: GEMINI_API_KEY is not set on the server");
    return refuse(503, DRAFT_COPY.noKey);
  }
  const { db, userId } = signedIn;
  try {
    const input = await gather(db, userId, companyId);
    if ("status" in input) return input;
    if (!(await takeRun(db, companyId, deps.now))) return refuse(429, DRAFT_COPY.limit);
    const result = await deps.generate(input, { apiKey: deps.apiKey }).catch((cause: unknown) => {
      console.error("Foothold drafts: the model call threw", cause instanceof Error ? cause.message : cause);
      return { ok: false, reason: "unavailable" } as const;
    });
    if (!result.ok) return refuse(...FAILURES[result.reason]);
    await keep(db, companyId, result.draft);
    return { status: 200, body: { draft: result.draft } };
  } catch (cause) {
    if (!(cause instanceof ReadFailed)) console.error("Foothold drafts: unexpected failure", cause);
    return refuse(502, DRAFT_COPY.readFailed);
  }
}
