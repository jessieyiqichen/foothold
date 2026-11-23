// Connector: a short first message from the person to someone at a company, about one role. Written in two steps by
// the drafts' harness (user, 2026-11-21): a plan (the role, the resume line, the posting phrase it answers, a phrase
// about the company, each checked word for word in its source), then the email from that plan, the person's own
// one-line intro and how they changed earlier drafts, checked for truth, voice and the tells of AI writing. Each step
// that fails a check goes back to the model once with the reasons. The person edits and sends it themselves;
// Foothold never sends anything.

import { askGemini, type AskResult } from "./gemini";
import { straightQuotes } from "./humanize";
import { checkPlan, PLAN_SCHEMA, readPlan, type Plan, type PlanSources } from "./plan";
import { PLAN_SYSTEM, WRITE_SCHEMA, WRITE_SYSTEM } from "./prompts";
import { nameFrom, resumeForModel, withoutContacts } from "./redact";
import { CHARS, checkDraft, type DraftText } from "./verify";

/** Tried in order; the next is used when one is not available to this key. Named on 2026-11-16 from Gemini's docs. */
export const DRAFT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-4-hydrogen"] as const;
/** The most of the resume a prompt carries, in characters. */
export const RESUME_MAX = 12_000;
const COMPANY_MAX = 3_000;
const POSTING_MAX = 4_000;
/** Each step's tries with one model. */
const ATTEMPTS = 2;
/** A retry starts only before this much of the request has gone: one more call (up to 25 s) still ends inside the
 *  route's 60 s (review, 2026-11-21: plan and write retries together could run past it). */
const RETRY_BEFORE_MS = 30_000;

export interface DraftEdit { before: { subject: string; body: string }; after: { subject: string; body: string } }

export interface DraftInput {
  resumeText: string;
  company: { name: string; oneLiner: string | null; description: string | null };
  roles: { title: string | null }[];
  person: { name: string | null; role: string | null } | null;
  /** The person's one line about themself, from their profile; null until they save one. */
  pitch?: string | null;
  /** The chosen role's posting, when the person chose one. */
  posting?: { title: string; text: string } | null;
  /** How the person changed earlier drafts, newest first. */
  edits?: DraftEdit[];
  /** "Try another angle": the resume line of the draft they want to move away from. */
  avoid?: string | null;
}
export type Draft = DraftText & { model: string };
export type DraftResult = { ok: true; draft: Draft } | { ok: false; reason: "rate_limited" | "unavailable" | "unverified" | "bad_input" };
type Deps = { apiKey: string; fetch?: typeof fetch; now?: () => number };

/** Text from outside may not open or close a fence, so every angle bracket in it becomes a space (removing only the
 *  tags let a nested tag rebuild itself; re-review, 2026-11-16). The quotes are checked against the same text. */
const clean = (text: string | null | undefined) => (text ?? "").replace(/[<>]/g, " ");
const companyText = (c: DraftInput["company"]) => clean([c.oneLiner, c.description].filter(Boolean).join("\n")).slice(0, COMPANY_MAX);
/** Only the experience goes to the model: no name line, no contact details (user, 2026-11-16). */
const resumeText = (input: DraftInput) => clean(resumeForModel(input.resumeText.slice(0, RESUME_MAX))).slice(0, RESUME_MAX);
const postingText = (input: DraftInput) => (input.posting ? clean(input.posting.text).slice(0, POSTING_MAX) : null);
const roleTitles = (input: DraftInput) =>
  input.posting ? [clean(input.posting.title).trim()] : input.roles.map((r) => clean(r.title).trim()).filter((t) => t.length > 0);

function sourcesOf(input: DraftInput): PlanSources {
  return { resume: resumeText(input), company: companyText(input.company), posting: postingText(input), roles: roleTitles(input), avoid: input.avoid ? clean(input.avoid) : null };
}

const fence = (tag: string, body: string) => `<${tag}>\n${body}\n</${tag}>`;
const fixLine = (problems: string[]) => (problems.length > 0 ? `\nYOUR LAST ANSWER WAS REFUSED: ${problems.join("; ")}. Fix exactly that.` : "");

function companyBlock(input: DraftInput, s: PlanSources): string {
  const p = input.person;
  const to = p?.name ? `${clean(p.name)}${p.role ? `, ${clean(p.role)}` : ""}` : "the founders (no name known)";
  return fence("company", `Name: ${clean(input.company.name)}\nWriting to: ${to}\nRoles they hire for: ${s.roles.join("; ") || "not named"}\nAbout:\n${s.company}`);
}

function planPrompt(input: DraftInput, s: PlanSources, problems: string[]): string {
  const posting = s.posting ? `\n${fence("posting", `${clean(input.posting?.title)}\n${s.posting}`)}` : "";
  const avoid = s.avoid ? `\nAVOID (the resume line not to use):\n${fence("avoid", s.avoid.slice(0, CHARS.quote))}` : "";
  return `${companyBlock(input, s)}${posting}\n${fence("resume", s.resume)}${avoid}${fixLine(problems)}`;
}

function writePrompt(input: DraftInput, s: PlanSources, plan: Plan, problems: string[]): string {
  const name = nameFrom(input.resumeText);
  const own = (text: string, max: number) => clean(withoutContacts(text, name)).slice(0, max);
  const pitch = input.pitch?.trim() ? own(input.pitch, 300) : "None given: say who they are only as the RESUME shows it.";
  const planText = [`Role: ${plan.roleTitle ?? "none listed"}`, `Resume line: ${plan.resumeQuote}`, `Posting phrase: ${plan.postingQuote ?? "none"}`, `Company phrase: ${plan.companyQuote}`, `Angle: ${plan.angle}`].join("\n");
  const edits = (input.edits ?? []).slice(0, 5).map((e, i) =>
    `Edit ${i + 1}\nTheir draft: ${own(e.before.subject, CHARS.subject)} / ${own(e.before.body, CHARS.body)}\nAs they changed it: ${own(e.after.subject, CHARS.subject)} / ${own(e.after.body, CHARS.body)}`).join("\n\n");
  return [companyBlock(input, s), fence("pitch", pitch), fence("plan", clean(planText)), edits ? fence("edits", edits) : "", fence("resume", s.resume)].filter(Boolean).join("\n") + fixLine(problems);
}

type Step<T> = { ok: true; value: T } | { ok: false; reason: "next" | "limited" | "unavailable" | "unverified" };

/** A model answer as a step outcome: a model this key cannot use moves on, a timeout or server error is
 *  "unavailable", and only a reply that was not valid JSON counts against the answer. */
function failed(r: Exclude<AskResult, { ok: true }>): Step<never> | "retry" {
  if (r.reason === "unavailable") return { ok: false, reason: "next" };
  // A limit is per model (Google, 2026-11-22: "limit: 20 requests per day" for gemini-3.6-flash): try the next one
  if (r.reason === "rate_limited") return { ok: false, reason: "limited" };
  if (r.reason === "failed") return { ok: false, reason: "unavailable" };
  return "retry";
}

/** One step with one model: up to ATTEMPTS tries, each refused answer's problems fed back. */
async function step<T>(deps: Deps & { startedAt: number }, model: string, system: string, schema: Record<string, unknown>, prompt: (problems: string[]) => string, read: (json: unknown) => { value: T | null; problems: string[] }): Promise<Step<T>> {
  let problems: string[] = [];
  const now = deps.now ?? Date.now;
  for (let i = 0; i < ATTEMPTS; i++) {
    if (i > 0 && now() - deps.startedAt > RETRY_BEFORE_MS) break;
    const r = await askGemini({ ...deps, model, system, input: prompt(problems), schema });
    if (!r.ok) {
      const out = failed(r);
      if (out !== "retry") return out;
      problems = ["the reply was not valid JSON"];
      continue;
    }
    const { value, problems: found } = read(r.json);
    if (value !== null && found.length === 0) return { ok: true, value };
    problems = found;
  }
  return { ok: false, reason: "unverified" };
}

function readEmail(json: unknown, plan: Plan): DraftText | null {
  const r = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  if (typeof r.subject !== "string" || typeof r.body !== "string") return null;
  return { subject: straightQuotes(r.subject.trim()), body: straightQuotes(r.body.trim()), resumeQuote: plan.resumeQuote, companyQuote: plan.companyQuote };
}

/** Both steps with one model; "next" when the model is not available to this key, "limited" when its quota is used. */
async function withModel(input: DraftInput, deps: Deps & { startedAt: number }, model: string): Promise<DraftResult | "next" | "limited"> {
  const s = sourcesOf(input);
  const allow = [...s.roles, clean(input.company.name)];
  const planned = await step(deps, model, PLAN_SYSTEM, PLAN_SCHEMA, (p) => planPrompt(input, s, p), (json) => {
    const plan = readPlan(json);
    return plan ? { value: plan, problems: checkPlan(plan, s) } : { value: null, problems: ["the reply was missing a field"] };
  });
  if (!planned.ok) return planned.reason === "next" || planned.reason === "limited" ? planned.reason : { ok: false, reason: planned.reason };
  const plan = planned.value;
  const written = await step(deps, model, WRITE_SYSTEM, WRITE_SCHEMA, (p) => writePrompt(input, s, plan, p), (json) => {
    const d = readEmail(json, plan);
    return d ? { value: d, problems: checkDraft(d, { ...s, allow }) } : { value: null, problems: ["the reply was missing a field"] };
  });
  if (!written.ok) return written.reason === "next" || written.reason === "limited" ? written.reason : { ok: false, reason: written.reason };
  return { ok: true, draft: { ...written.value, model } };
}

export async function generateDraft(input: DraftInput, deps: Deps & { models?: readonly string[] }): Promise<DraftResult> {
  if (resumeText(input).trim().length === 0 || input.company.name.trim().length === 0) return { ok: false, reason: "bad_input" };
  if (!deps.apiKey) return { ok: false, reason: "unavailable" };
  const startedAt = (deps.now ?? Date.now)();
  let limited = false;
  for (const model of deps.models ?? DRAFT_MODELS) {
    const r = await withModel(input, { ...deps, startedAt }, model);
    if (r === "limited") limited = true;
    else if (r !== "next") return r;
  }
  return { ok: false, reason: limited ? "rate_limited" : "unavailable" };
}
