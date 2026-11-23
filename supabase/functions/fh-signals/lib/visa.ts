// What a posting says about visas (docs/judge-signals.md): sponsors, will not sponsor (now or in the future), or US
// citizens / US persons / green-card holders only, security clearance, ITAR. Equal-opportunity lines never count.
// Where the text says two of these that cannot both hold, the sentences go to the model. No Deno or Node imports.

import type { Segment } from "./sentences.ts";

export type Visa = "sponsors" | "no_sponsorship" | "citizens_only";
export const VISAS: readonly Visa[] = ["sponsors", "no_sponsorship", "citizens_only"];

export interface VisaValue {
  value: Visa;
  quote: string;
}

export interface VisaPending {
  kind: "visa";
  sentence: string;
}

const EEO = /regardless of|without regard to|discriminat|equal (?:employment )?opportunit|protected (?:class|characteristic|status|veteran)|on the basis of|national origin/i;
const SPONSOR_WORD = /sponsor|\bH-?1B\b|\bPERM\b|green card (?:process|application)/i;
const NEGATIVE = /\b(?:not|no|unable|cannot|can(?:'|’)t|won(?:'|’)t|will not|don(?:'|’)t|do not|does not|doesn(?:'|’)t|isn(?:'|’)t|is not|are not|aren(?:'|’)t|without|never|nor)\b/i;
const NEGATIVE_AFTER = /sponsor\w*[^.]{0,40}\b(?:not (?:available|offered|provided|possible)|unavailable|is not|isn(?:'|’)t)\b/i;
const CANDIDATE_NEEDS = /\b(?:requir\w*|need\w*)\s+(?:\w+\s+){0,3}(?:visa\s+)?sponsor/i;
const POSITIVE = /\b(?:will|can|do|does|we|happy to|able to|offers?|provides?|supports?|available|full|including|includ\w*)\b[^.]{0,40}\b(?:sponsor|H-?1B|PERM)|(?:visa|H-?1B|immigration|green card) sponsorship|sponsorship (?:is )?(?:available|offered|provided)/i;
const CITIZEN = /\b(?:U\.?S\.?|United States|American) (?:citizens?|citizenship|persons?|nationals?)\b|green[- ]card holders?|(?:lawful )?permanent residents?/i;
const ONLY = /\b(?:only|must|required?|requires|requirement|mandatory|need to be|eligib\w*|restricted to)\b/i;
const CLEARANCE = /\b(?:security|secret|top secret|TS\/SCI|government|DoD) clearance\b|\bTS\/SCI\b|\bclearance (?:is )?required\b/i;
const ITAR = /\bITAR\b|export control/i;
const WHETHER = /\b(?:states?|indicates?|specif(?:y|ies)|notes?|lists?|says?|mentions?|shows?)\s+whether\b|\bwhether (?:or not )?(?:visa |H-?1B )?sponsorship\b/i;
const OPTIONAL = /\b(?:preferred|nice[- ]to[- ]have|a plus|bonus|ideally|not required)\b/i;

/** The visa values one sentence states: none, one, or two that clash ("US citizens only" and "we sponsor"). */
export function visaIn(s: string): Visa[] {
  if (EEO.test(s)) return [];
  const restricted = (CLEARANCE.test(s) || ITAR.test(s)) && !OPTIONAL.test(s) && (ONLY.test(s) || CLEARANCE.test(s) || /^ITAR/i.test(s.trim()));
  const citizens = (CITIZEN.test(s) && ONLY.test(s)) || restricted;
  const own: Visa[] = citizens ? ["citizens_only"] : [];
  if (!SPONSOR_WORD.test(s)) return own;
  if (/\?\s*$/.test(s)) return own; // an application question ("Will you now or in the future require sponsorship?")
  if (NEGATIVE.test(s) || NEGATIVE_AFTER.test(s)) return citizens ? own : ["no_sponsorship"];
  if (CANDIDATE_NEEDS.test(s)) return own;
  if (WHETHER.test(s)) return own; // "Each posting states whether sponsorship is available": no promise either way // "If you need sponsorship, say so": no promise either way
  return POSITIVE.test(s) ? [...own, "sponsors"] : own;
}

/** citizens_only and no_sponsorship agree (no one gets a visa); sponsors with either of them does not. */
export function agree(values: readonly Visa[]): Visa | null {
  const set = new Set(values);
  if (set.size === 0) return null;
  if (set.has("sponsors")) return set.size === 1 ? "sponsors" : null;
  return set.has("citizens_only") ? "citizens_only" : "no_sponsorship";
}

/** The posting's visa value with its first sentence, or, when sentences disagree, every stating sentence as pending. */
export function visaOf(segments: readonly Segment[]): { visa: VisaValue | null; pending: VisaPending[] } {
  const found = segments.flatMap((seg) => visaIn(seg.quote).map((value) => ({ value, quote: seg.quote })));
  const value = agree(found.map((f) => f.value));
  if (value === null && found.length > 0) {
    const sentences = [...new Set(found.map((f) => f.quote))];
    return { visa: null, pending: sentences.map((sentence) => ({ kind: "visa" as const, sentence })) };
  }
  const first = found.find((f) => f.value === value);
  return { visa: first ? { value: first.value, quote: first.quote } : null, pending: [] };
}
