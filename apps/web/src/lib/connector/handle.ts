// POST /api/drafts, as logic the tests can run: the route (app/api/drafts/route.ts) passes in the signed-in person's
// database client, the request's content type and body, the server's key and the real generateDraft. Every read is
// made with the person's own token, so row-level security decides what they reach; the model sees only their own
// resume. The one write is the try, taken by the database (fh_take_draft_run). The draft is not saved here: the
// person's browser saves it with its own client, whose token is refreshed, since a slow model call can outlive the
// token this request came with (reviewer, 2026-11-16).
import type { SupabaseClient } from "@supabase/supabase-js";
import { AVOID_MAX, EDITS_KEPT, EDITS_TABLE, FIT_DAYS, RESUME_CAP, TAKE_RUN_RPC } from "./constants";
import { DRAFT_COPY } from "./copy";
import type { Draft, DraftEdit, DraftFailure, DraftInput, Generate } from "./types";

export type HandleDb = Pick<SupabaseClient, "from" | "rpc">;

export interface HandleDeps {
  db: HandleDb;
  userId: string;
  /** The request's Content-Type header. */
  contentType: string | null;
  body: unknown;
  apiKey: string | undefined;
  generate: Generate;
}

export type DraftAnswer = { status: number; body: { draft: Draft } | { error: string } };

const refuse = (status: number, error: string): DraftAnswer => ({ status, body: { error } });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

/** The company id from the body: a positive whole number, sent as a number or as digits. */
export function parseCompanyId(body: unknown): number | null {
  if (!isRecord(body)) return null;
  return positiveId(body.company_id);
}

const positiveId = (raw: unknown): number | null => {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : raw;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
};

/** The role the person chose on the company page: absent or null means none chosen; anything else must be a positive
 *  whole number (or digits), or the request is refused. */
export function parseRoleId(body: unknown): { roleId: number | null } | null {
  const raw = isRecord(body) ? body.role_id : undefined;
  if (raw === undefined || raw === null) return { roleId: null };
  const id = positiveId(raw);
  return id === null ? null : { roleId: id };
}

/** "Try another angle": `another: true` asks for a draft away from the resume line of the person's saved draft for this
 *  company, which the server reads itself (review, 2026-11-21: text from the browser is not trusted into the prompt).
 *  Absent, null or false means a plain draft; anything else is refused. */
export function parseAnother(body: unknown): { another: boolean } | null {
  const raw = isRecord(body) ? body.another : undefined;
  if (raw === undefined || raw === null || raw === false) return { another: false };
  return raw === true ? { another: true } : null;
}

/** The resume line of the person's saved draft for this company, read with their own token; null when there is none. */
async function savedLine(db: HandleDb, userId: string, companyId: number): Promise<string | null> {
  const row = check("your saved draft", await db.from("fh_drafts").select("resume_quote").eq("user_id", userId).eq("company_id", companyId).maybeSingle());
  const line = isRecord(row) ? text(row.resume_quote) : null;
  return line ? line.slice(0, AVOID_MAX) : null;
}

/** Whether the body carries the person's agreement: `consent` must be exactly true. */
const hasConsent = (body: unknown): boolean => isRecord(body) && body.consent === true;

/** Whether a Content-Type header says JSON (a charset is allowed). */
export const isJson = (contentType: string | null): boolean => (contentType ?? "").split(";")[0].trim().toLowerCase() === "application/json";

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

/** The chosen role's title and posting, read as the person: it must be an open role at this company. */
async function chosenRole(db: HandleDb, companyId: number, roleId: number): Promise<{ title: string; text: string } | DraftAnswer> {
  const row = check("the chosen role", await db.from("fh_postings").select("id, company_id, title, text, closed_at").eq("id", roleId).maybeSingle());
  const fits = isRecord(row) && Number(row.company_id) === companyId && row.closed_at === null && text(row.title);
  return fits ? { title: (row.title as string).trim(), text: text(row.text) ?? "" } : refuse(400, DRAFT_COPY.badRole);
}

/** The person's newest edits to earlier drafts, read with their own token (row-level security keeps them theirs). */
async function recentEdits(db: HandleDb, userId: string): Promise<DraftEdit[]> {
  const rows = check("your edits", await db.from(EDITS_TABLE).select("before_subject, before_body, after_subject, after_body")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(EDITS_KEPT));
  return (Array.isArray(rows) ? rows : []).flatMap((r): DraftEdit[] => {
    if (!isRecord(r)) return [];
    const [bs, bb, as, ab] = [text(r.before_subject), text(r.before_body), text(r.after_subject), text(r.after_body)];
    return bs && bb && as && ab ? [{ before: { subject: bs, body: bb }, after: { subject: as, body: ab } }] : [];
  });
}

/** The model's input: the person's resume (capped) and one-line intro, the company's own words, the chosen role and
 *  its posting (or the card's roles), its person, the person's newest edits, and a line to move away from. An answer
 *  instead when there is no resume, no such company, or the role is not open there. */
async function gather(db: HandleDb, userId: string, companyId: number, roleId: number | null, another: boolean): Promise<DraftInput | DraftAnswer> {
  const profile = check("the profile", await db.from("fh_profiles").select("resume_text, pitch").eq("user_id", userId).maybeSingle());
  const resume = isRecord(profile) ? text(profile.resume_text) : null;
  if (!resume) return refuse(409, DRAFT_COPY.noResume);
  const company = check("the company", await db.from("fh_companies").select("name, one_liner, description").eq("id", companyId).maybeSingle());
  if (!isRecord(company) || !text(company.name)) return refuse(404, DRAFT_COPY.badCompany);
  const fit = check("the company's roles", await db.rpc("fh_company_fit", { p_days: FIT_DAYS, p_companies: [companyId] }));
  const person = check("the company's person", await db.rpc("fh_company_person", { p_company: companyId }));
  const picked = roleId === null ? null : await chosenRole(db, companyId, roleId);
  if (picked && "status" in picked) return picked;
  const fitRoles = (Array.isArray(fit) ? fit : []).flatMap((row) => (isRecord(row) && Array.isArray(row.roles) ? row.roles : []))
    .flatMap((role) => (isRecord(role) && text(role.title) ? [{ title: (role.title as string).trim() }] : []));
  const roles = picked ? [{ title: picked.title }] : fitRoles;
  return {
    resumeText: resume.slice(0, RESUME_CAP),
    company: { name: (company.name as string).trim(), oneLiner: text(company.one_liner), description: text(company.description) },
    roles,
    person: isRecord(person) ? { name: text(person.name), role: text(person.role) } : null,
    pitch: isRecord(profile) ? text(profile.pitch) : null,
    posting: picked,
    edits: await recentEdits(db, userId),
    avoid: another ? await savedLine(db, userId, companyId) : null,
  };
}

/** Takes one of today's tries; the database counts and refuses under a lock, so parallel requests cannot pass it. */
async function takeRun(db: HandleDb, companyId: number): Promise<boolean> {
  return check("a try", await db.rpc(TAKE_RUN_RPC, { p_company: companyId })) === true;
}

/** POST /api/drafts: refuses what it must before the model is called, takes a try, writes, answers. */
export async function handleDraftRequest(signedIn: Pick<HandleDeps, "db" | "userId"> | null, deps: Omit<HandleDeps, "db" | "userId">): Promise<DraftAnswer> {
  if (!signedIn) return refuse(401, DRAFT_COPY.signedOut);
  if (!isJson(deps.contentType)) return refuse(415, DRAFT_COPY.notJson);
  // The person's agreement to send their experience to Gemini travels with every request; the browser's memory of it
  // is not enough on its own
  if (!hasConsent(deps.body)) return refuse(400, DRAFT_COPY.noConsent);
  const companyId = parseCompanyId(deps.body);
  if (companyId === null) return refuse(400, DRAFT_COPY.badCompany);
  const role = parseRoleId(deps.body);
  if (role === null) return refuse(400, DRAFT_COPY.badRole);
  const angle = parseAnother(deps.body);
  if (angle === null) return refuse(400, DRAFT_COPY.badAngle);
  if (!deps.apiKey) {
    console.error("Foothold drafts: GEMINI_API_KEY is not set on the server");
    return refuse(503, DRAFT_COPY.noKey);
  }
  const { db, userId } = signedIn;
  try {
    const input = await gather(db, userId, companyId, role.roleId, angle.another);
    if ("status" in input) return input;
    if (!(await takeRun(db, companyId))) return refuse(429, DRAFT_COPY.limit);
    const result = await deps.generate(input, { apiKey: deps.apiKey }).catch((cause: unknown) => {
      console.error("Foothold drafts: the model call threw", cause instanceof Error ? cause.message : cause);
      return { ok: false, reason: "unavailable" } as const;
    });
    if (!result.ok) return refuse(...FAILURES[result.reason]);
    return { status: 200, body: { draft: result.draft } };
  } catch (cause) {
    if (!(cause instanceof ReadFailed)) console.error("Foothold drafts: unexpected failure", cause);
    return refuse(502, DRAFT_COPY.readFailed);
  }
}
