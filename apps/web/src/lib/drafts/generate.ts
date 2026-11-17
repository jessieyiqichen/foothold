// Connector: a short first message from the person to someone at a company, resting on one line of their resume and
// one line about the company, both quoted word for word and checked before the draft is shown (user, 2026-11-16).
// The person edits and sends it themselves; Foothold never sends anything.

import { askGemini } from "./gemini";
import { checkDraft, type DraftText } from "./verify";

/** Tried in order; the next is used when one is not available to this key. Named on 2026-11-16 from Gemini's docs. */
export const DRAFT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-4-hydrogen"] as const;
/** The most of the resume a prompt carries, in characters. */
export const RESUME_MAX = 12_000;
const COMPANY_MAX = 3_000;
const ATTEMPTS = 2;

export interface DraftInput {
  resumeText: string;
  company: { name: string; oneLiner: string | null; description: string | null };
  roles: { title: string | null }[];
  person: { name: string | null; role: string | null } | null;
}
export type Draft = DraftText & { model: string };
export type DraftResult = { ok: true; draft: Draft } | { ok: false; reason: "rate_limited" | "unavailable" | "unverified" | "bad_input" };

const SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" }, body: { type: "string" }, resume_quote: { type: "string" }, company_quote: { type: "string" },
  },
  required: ["subject", "body", "resume_quote", "company_quote"],
};

export const SYSTEM = [
  "You write a first email from a job seeker to one person at a startup. The seeker will read, edit and send it.",
  "Write 60 to 120 words in plain, warm English: who they are in one sentence, why this company, why them, and one clear ask (a 15 minute call).",
  "resume_quote: copy one phrase of at least four words exactly as it appears in the RESUME. company_quote: copy one phrase of at least four words exactly as it appears in COMPANY.",
  "Use only facts in the RESUME. Never invent a number, a skill, a title or a result. No email address, no link, no greeting line with a guessed name if none is given.",
].join(" ");

const companyText = (c: DraftInput["company"]) => [c.oneLiner, c.description].filter(Boolean).join("\n").slice(0, COMPANY_MAX);

function prompt(input: DraftInput, problems: string[]): string {
  const to = input.person?.name ? `${input.person.name}${input.person.role ? `, ${input.person.role}` : ""}` : "the founders (no name known)";
  const roles = input.roles.map((r) => r.title).filter(Boolean).join("; ") || "not named";
  const fix = problems.length > 0 ? `\nYOUR LAST DRAFT WAS REFUSED: ${problems.join("; ")}. Fix exactly that.` : "";
  return `TO: ${to} at ${input.company.name}\nROLES THEY HIRE FOR: ${roles}\nCOMPANY:\n${companyText(input.company)}\nRESUME:\n${input.resumeText.slice(0, RESUME_MAX)}${fix}`;
}

function readDraft(json: unknown): DraftText | null {
  const r = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string).trim() : null);
  const [subject, body, resumeQuote, companyQuote] = [s("subject"), s("body"), s("resume_quote"), s("company_quote")];
  return subject !== null && body !== null && resumeQuote !== null && companyQuote !== null ? { subject, body, resumeQuote, companyQuote } : null;
}

/** One model, up to ATTEMPTS tries, each refused draft's problems fed back. */
async function withModel(input: DraftInput, deps: { apiKey: string; fetch?: typeof fetch }, model: string): Promise<DraftResult | "next"> {
  const sources = { resume: input.resumeText.slice(0, RESUME_MAX), company: companyText(input.company) };
  let problems: string[] = [];
  for (let i = 0; i < ATTEMPTS; i++) {
    const r = await askGemini({ ...deps, model, system: SYSTEM, input: prompt(input, problems), schema: SCHEMA });
    if (!r.ok) return r.reason === "unavailable" ? "next" : r.reason === "rate_limited" ? { ok: false, reason: "rate_limited" } : { ok: false, reason: "unverified" };
    const d = readDraft(r.json);
    problems = d ? checkDraft(d, sources) : ["the reply was missing a field"];
    if (d && problems.length === 0) return { ok: true, draft: { ...d, model } };
  }
  return { ok: false, reason: "unverified" };
}

export async function generateDraft(input: DraftInput, deps: { apiKey: string; fetch?: typeof fetch; models?: readonly string[] }): Promise<DraftResult> {
  if (input.resumeText.trim().length === 0 || input.company.name.trim().length === 0) return { ok: false, reason: "bad_input" };
  if (!deps.apiKey) return { ok: false, reason: "unavailable" };
  for (const model of deps.models ?? DRAFT_MODELS) {
    const r = await withModel(input, deps, model);
    if (r !== "next") return r;
  }
  return { ok: false, reason: "unavailable" };
}
