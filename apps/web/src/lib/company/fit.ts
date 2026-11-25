// Step 1 of a role page's action card, "Is it a fit" (user, 2026-11-23): one sentence of why, built by rules from the
// shared skills (no model call); at most one warning line, the most serious problem first.
// Everything here is pure.
import { NEEDS_YEARS_MIN } from "../signals/constants";
import type { Signals } from "../signals/types";
import { needsYearsLine, ROLE_PAGE_COPY } from "./pageCopy";

/** The reason line never runs past this many words: one short line, as the mockup (user, 2026-11-23). */
export const MAX_REASON_WORDS = 15;
/** Skills named in the line; the rest are not counted. */
export const MAX_NAMED_SKILLS = 3;

/** Stored tags are lower case; these read as their usual capitals in a sentence. */
const SKILL_NAMES: Readonly<Record<string, string>> = {
  sql: "SQL", llm: "LLM", llms: "LLMs", ai: "AI", ml: "ML", nlp: "NLP", api: "API", apis: "APIs", ui: "UI", ux: "UX",
  aws: "AWS", gcp: "GCP", etl: "ETL", crm: "CRM", saas: "SaaS", b2b: "B2B", b2c: "B2C", ios: "iOS", css: "CSS",
  html: "HTML", rag: "RAG", gpu: "GPU", sdk: "SDK", seo: "SEO", kpi: "KPI", kpis: "KPIs", gtm: "GTM", qa: "QA",
};

/** A stored tag as it reads in a sentence: each known abbreviation in capitals, any other word as stored. */
export const skillName = (tag: string): string =>
  tag.split(/(\s+|\/)/).map((part) => SKILL_NAMES[part.toLowerCase()] ?? (part.length === 1 && /[a-z]/.test(part) ? part.toUpperCase() : part)).join("");

const wordsOf = (line: string): string[] => line.split(/\s+/).filter(Boolean);

function joinAnd(items: readonly string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function sentenceWith(named: readonly string[]): string {
  if (named.length === 1) return `Your ${named[0]} work ${ROLE_PAGE_COPY.asksForOne}`;
  return `Your ${joinAnd(named)} work ${ROLE_PAGE_COPY.asksFor}`;
}

/** "Your evals, SQL and LLMs work match this role": up to three skills, in the order given (rarest first, see
 *  topTags), the rest not counted; at most MAX_REASON_WORDS words. */
export function reasonSentence(tags: readonly string[]): string {
  const skills = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].map(skillName);
  if (skills.length === 0) return ROLE_PAGE_COPY.noShared;
  for (let n = Math.min(MAX_NAMED_SKILLS, skills.length); n >= 1; n -= 1) {
    const line = sentenceWith(skills.slice(0, n));
    if (wordsOf(line).length <= MAX_REASON_WORDS) return line;
  }
  return `${wordsOf(sentenceWith(skills.slice(0, 1))).slice(0, MAX_REASON_WORDS).join(" ")}…`;
}

/** The role's own shared skills in the company's order (fh_company sorts the company's by weight, rare ones first;
 *  the role's come alphabetical), skills the company list lacks last. A new array. */
export function topTags(roleShared: readonly string[], companyShared: readonly string[]): string[] {
  const rank = (tag: string) => {
    const at = companyShared.indexOf(tag);
    return at === -1 ? companyShared.length : at;
  };
  return [...roleShared].sort((a, b) => rank(a) - rank(b));
}

/** Whether the person's graduation date falls in the window a role hires for. No data yet (2026-11-23): a hook, so the
 *  check can be added later without changing the card. */
export interface GraduationCheck {
  outside: boolean;
  quote: string | null;
}

export type WarningKind = "graduation" | "visa" | "years";

export interface FitWarning {
  kind: WarningKind;
  label: string;
  /** The posting's sentence, shown in Details and highlighted in the posting; null when there is none. */
  quote: string | null;
}

/** Years required and 3 or more; the row's needs_years arrives as years.needs (signals/parse.ts). */
const needsYears = (years: Signals["years"]): boolean => !!years && (years.needs || (years.required && years.min >= NEEDS_YEARS_MIN));

/** Every problem found, most serious first: graduation window > no visa (citizens only or no sponsorship) > 3+ years
 *  required. Empty when there is no problem or nothing is known. The card shows the first; Details shows them all. */
export function fitWarnings({ signals, graduation }: { signals?: Signals | null; graduation?: GraduationCheck | null }): FitWarning[] {
  const warnings: FitWarning[] = [];
  if (graduation?.outside) warnings.push({ kind: "graduation", label: ROLE_PAGE_COPY.graduation, quote: graduation.quote });
  const visa = signals?.visa;
  if (visa && visa.value !== "sponsors") {
    warnings.push({ kind: "visa", label: visa.value === "citizens_only" ? ROLE_PAGE_COPY.citizensOnly : ROLE_PAGE_COPY.noSponsorship, quote: visa.quote });
  }
  const years = signals?.years;
  if (years && needsYears(years)) warnings.push({ kind: "years", label: needsYearsLine(years.min), quote: years.quote });
  return warnings;
}


