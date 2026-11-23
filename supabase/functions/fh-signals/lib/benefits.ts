// Equity and 401(k): true only, each with the first sentence that offers it (docs/judge-signals.md). "Diversity,
// equity and inclusion", "private equity", "equity research", "health equity", "brand equity" and the like are not
// an offer of equity; nor is a sentence that says there is none. No Deno or Node imports.

import type { Segment } from "./sentences.ts";

export interface FlagValue {
  quote: string;
}

const EQUITY = /\bequity\b|\bstock options?\b|\bRSUs?\b|\bownership stake\b/i;
// "equity" as another word: fairness, finance, a field of work
const NOT_EQUITY = /(?:diversity|inclusion|inclusive|\bDEI\b|\bDE&I\b|private|health|brand|racial|social|gender|pay|educational|education|digital|home|sweat|public|growth|access|justice|fairness|opportunity|belonging)[\s,]*(?:,\s*)?(?:(?:and|&)\s+)?equity|equity[\s,]*(?:and|&)\s*(?:inclusion|justice|access|belonging)|equity,\s*diversity|equity (?:research|analyst|markets?|capital|funds?|firms?|partners|investors?|investments?|deals?|financing|raise|round|crowdfunding|portfolio|trading|derivatives|valuation|in (?:health|education|access|hiring))/i;
const NONE = /\b(?:no|not|without|don(?:'|’)t|do not|does not|isn(?:'|’)t)\b[^.]{0,30}\b(?:equity|stock options?|401\s*\(?k\)?)|\b(?:exclud\w*|(?:does|do) not include|doesn(?:'|’)t include|not including)\b[^.]{0,60}\bequity/i;
/** Web addresses: "...-addiction-equity-act" in a link is not an offer */
const URL = /\bhttps?:\/\/\S+|\bwww\.\S+|\b[\w-]+\.(?:com|org|gov|net|io|edu)\/\S*/gi;
const K401 = /\b401\s?\(?k\)?(?![a-z])/i;

/** The sentence a posting offers equity in, or null. A sentence that names equity both ways ("equity research ... and
 *  equity") counts only when an offer stands once the other uses are taken out. */
export function equityOf(segments: readonly Segment[]): FlagValue | null {
  for (const seg of segments) {
    const s = seg.quote.replace(URL, " ");
    if (!EQUITY.test(s) || NONE.test(s)) continue;
    const rest = s.replace(new RegExp(NOT_EQUITY.source, "gi"), " ");
    if (EQUITY.test(rest)) return { quote: seg.quote };
  }
  return null;
}

/** The sentence a posting offers a 401(k) in, or null. */
export function k401Of(segments: readonly Segment[]): FlagValue | null {
  for (const seg of segments) {
    if (K401.test(seg.quote) && !NONE.test(seg.quote)) return { quote: seg.quote };
  }
  return null;
}
