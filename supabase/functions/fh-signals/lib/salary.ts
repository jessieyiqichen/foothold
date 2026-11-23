// The pay a posting states: a range or a floor in a currency, per year or per hour (docs/judge-signals.md).
// Funding, market sizes, percentages, bonuses and benefit amounts are left out, and so is anything outside sane bounds.
// No Deno or Node imports.

import type { Segment } from "./sentences.ts";

export type Period = "year" | "hour";

export const BOUNDS: Record<Period, { min: number; max: number }> = {
  year: { min: 15_000, max: 1_000_000 },
  hour: { min: 10, max: 500 },
};

export interface SalaryValue {
  min: number;
  /** null for a floor ("$150k+") */
  max: number | null;
  currency: string;
  period: Period;
  ote: boolean;
  quote: string;
}

interface Amount {
  value: number;
  start: number;
  end: number;
  symbol: string | null;
  /** a bare "$" before it */
  dollar: boolean;
  codeAfter: string | null;
  k: boolean;
}

const CODES = "USD|EUR|GBP|CAD|AUD|SGD|HKD|NZD|CHF";
const SYMBOL_BEFORE = new RegExp(`(US\\$|CA\\$|C\\$|A\\$|S\\$|HK\\$|NZ\\$|\\$|€|£)\\s?$|\\b(${CODES})\\s?$`);
/** "$" alone is not here: a bare dollar is read from the sentence (dollarOf) */
const SYMBOLS: Record<string, string> = { "US$": "USD", "CA$": "CAD", "C$": "CAD", "A$": "AUD", "S$": "SGD", "HK$": "HKD", "NZ$": "NZD", "€": "EUR", "£": "GBP" };
const BARE = "$";
/** The dollar a bare "$" means: USD, unless the sentence names another dollar. */
const OTHER_DOLLARS: Array<[RegExp, string]> = [
  [/\bCAD\b|\bCA\$|(?<![A-Z])C\$/, "CAD"], [/\bAUD\b|(?<![A-Z])A\$/, "AUD"], [/\bSGD\b|(?<![A-Z])S\$/, "SGD"],
  [/\bHKD\b|\bHK\$/, "HKD"], [/\bNZD\b|\bNZ\$/, "NZD"],
];
const dollarOf = (s: string): string => OTHER_DOLLARS.find(([re]) => re.test(s))?.[1] ?? "USD";
// Not pay: a deal, revenue or contract size next to the amount, or an amount on an equity or bonus line
const DEAL_AFTER = /^.{0,20}?\b(?:ACV|ARR|TCV|GMV|annual recurring|recurring revenue|revenue|deals?|deal sizes?|contract values?|in sales|pipeline)\b/i;
const DEAL_BEFORE = /\b(?:ACV|ARR|TCV|GMV|revenue|deals?|deal sizes?|contract values?|book of|pipeline)\b[^.;]{0,20}$/i;
const GRANT_BEFORE = /\b(?:equity|RSUs?|stock(?: options?)?|options|sign(?:ing|-on) bonus|bonus of)\b[^\d$€£.;]{0,15}$/i;
const PERIOD_GAP = /^\s?(?:\/\s?(?:hour|hr|h|year|yr)\b|per (?:hour|hr|year|annum)\b|an hour|a year)/i;
const BIG_AFTER = /^\s?(?:[MB]\b|mm\b|bn\b|million|billion|trillion|%)/i;
const K_AFTER = /^\s?[kK](?![a-zA-Z])/;
const CODE_AFTER = new RegExp(`^\\s?(?:[kK])?\\s?(?:(€|£)|\\b(${CODES})\\b)`);
const NOT_PAY_AFTER = /^[\s+]*(?:[kK]\s?)?(?:USD\s*)?(?:(?:annual|yearly)\s+)?(?:(?:signing|sign-on|referral|relocation|joining|learning|wellness|education|home office|equipment)\b|bonus|stipend|budget|allowance|credit|reimburse|in (?:funding|revenue|sales|ARR|spend|annual))/i;
const FLOOR_AFTER = /^\s?(?:[kK])?\+(?=$|[\s,.;)])(?!\s*(?:equity|bonus|commission|benefits|stock|options))/i;
const RANGE_GAP = /^\s*(?:-|–|—|to|and)\s*$/i;
const PAY_CUE = /salary|compensation|\bcomp\b|\bpay\b|\bbase\b|\brange\b|\bOTE\b|on[- ]target|earnings|\bwages?\b|\brate\b|per (?:year|hour|annum)|\/\s?(?:hour|hr|year|yr)\b|annual|hourly|\+\s*equity/i;
const NOT_PAY = /raised|funding|series [a-f]\b|seed round|valuation|revenue|\bARR\b|market|backed by|investors|\bspend\b|exit|deals? worth|referral|signing bonus|sign-on|relocation|budget|stipend|reimburse|allowance|fertility|\bHRA\b|\bHSA\b|\bFSA\b|grants?\b/i;
const OTE = /\bOTE\b|on[- ]target|target earnings|total (?:target )?(?:cash|compensation)|variable/i;
const HOUR_AFTER = /^\s?(?:[kK])?\s?(?:USD|CAD|EUR|GBP)?\s?(?:\/\s?(?:hour|hr|h)\b|per (?:hour|hr)\b|an hour|hourly|p\/h)/i;
const YEAR_AFTER = /^\s?(?:[kK])?\s?(?:USD|CAD|EUR|GBP)?\s?(?:\/\s?(?:year|yr|y|annum)\b|per (?:year|yr|annum)\b|a year|annually|yearly|p\.?a\.?)/i;
const MONTH_AFTER = /^\s?(?:[kK])?\s?(?:USD|CAD|EUR|GBP)?\s?(?:\/\s?(?:month|mo)\b|per month|a month|monthly)/i;
const HOURLY = /\bhourly\b|per hour|\/\s?(?:hour|hr)\b|an hour/i;
const MONTHLY = /\bmonthly\b|per month|\/\s?(?:month|mo)\b|a month/i;

/** Money amounts in a sentence: a number with a currency next to it or next to its range partner. */
function amountsOf(s: string): Amount[] {
  const out: Amount[] = [];
  for (const m of s.matchAll(/(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const prev = s[start - 1] ?? "";
    if (/[A-Za-z\d.,]/.test(prev) && !new RegExp(`(?:${CODES})$`).test(s.slice(0, start))) continue;
    const rest = s.slice(end);
    if (BIG_AFTER.test(rest) || NOT_PAY_AFTER.test(rest)) continue;
    const sym = SYMBOL_BEFORE.exec(s.slice(Math.max(0, start - 5), start));
    const code = CODE_AFTER.exec(rest);
    const k = K_AFTER.test(rest);
    const value = Number(m[0].replace(/,/g, "")) * (k ? 1000 : 1);
    const dollar = sym?.[1] === BARE;
    const symbol = sym && !dollar ? (sym[1] ? SYMBOLS[sym[1]] : sym[2]) : null;
    out.push({ value, start, end, symbol, dollar, codeAfter: code ? (code[1] ? SYMBOLS[code[1]] : code[2]) : null, k });
  }
  return out;
}

function periodOf(s: string, end: number): Period | "month" {
  const after = s.slice(end, end + 20);
  if (HOUR_AFTER.test(after)) return "hour";
  if (YEAR_AFTER.test(after)) return "year";
  if (MONTH_AFTER.test(after)) return "month";
  if (HOURLY.test(s)) return "hour";
  if (MONTHLY.test(s)) return "month";
  return "year";
}

const inBounds = (v: number, p: Period) => v >= BOUNDS[p].min && v <= BOUNDS[p].max;

/** A deal or revenue size, or an amount on an equity or bonus line, around [start, end). */
const notPay = (s: string, start: number, end: number): boolean => {
  const before = s.slice(Math.max(0, start - 25), start);
  return DEAL_AFTER.test(s.slice(end, end + 40)) || DEAL_BEFORE.test(before) || GRANT_BEFORE.test(before.replace(/[$€£]\s?$/, ""));
};

/** One candidate from amount a (and b, its range partner, if any). */
function candidate(s: string, a: Amount, b: Amount | null, fromIndex: number): SalaryValue | null {
  const currency = b?.codeAfter ?? a.codeAfter ?? a.symbol ?? b?.symbol ?? (a.dollar || b?.dollar ? dollarOf(s) : null);
  if (currency === null) return null;
  const last = b ?? a;
  if (notPay(s, a.start, last.end)) return null;
  let lo = a.value;
  let hi = b ? b.value : null;
  if (b && a.k && !b.k && hi !== null && hi < 1000) hi *= 1000;
  if (b && !a.k && lo < 1000 && hi !== null && hi >= 1000 && lo * 1000 <= hi) lo *= 1000; // "$150-300k", "$200-300,000"
  const floor = !b && FLOOR_AFTER.test(s.slice(a.end));
  if (!b && !floor && !PAY_CUE.test(s)) return null;
  if (NOT_PAY.test(s) && !PAY_CUE.test(s)) return null;
  const period = periodOf(s, last.end);
  if (period === "month") return null;
  const max = b ? hi : floor ? null : lo;
  if (!inBounds(lo, period) || (max !== null && (!inBounds(max, period) || max < lo))) return null;
  const ote = OTE.test(s.slice(fromIndex, a.start)) || /^\s?(?:[kK])?\+?\s?(?:USD)?\s?\(?OTE\b/i.test(s.slice(last.end));
  return { min: lo, max, currency, period, ote, quote: s };
}

/** The text between two amounts with their k, codes, periods and currency marks taken out ("/hour and $" is "and"). */
const gapOf = (between: string): string => between.replace(/^\s?[kK]/, "").replace(new RegExp(`^\\s?(?:${CODES})\\b`), "")
  .replace(PERIOD_GAP, "").replace(new RegExp(`(?:US\\$|CA\\$|C\\$|A\\$|S\\$|HK\\$|NZ\\$|\\$|€|£|\\b(?:${CODES}))\\s?$`), "");

/** Every salary stated in one sentence, in order. */
export function salariesIn(s: string): SalaryValue[] {
  const amounts = amountsOf(s);
  const out: SalaryValue[] = [];
  let from = 0;
  for (let i = 0; i < amounts.length; i++) {
    const a = amounts[i];
    const b = amounts[i + 1];
    const gap = b ? gapOf(s.slice(a.end, b.start)) : "";
    const isRange = b !== undefined && RANGE_GAP.test(gap) && (!/and/i.test(gap) || /between\s+\S*$/i.test(s.slice(Math.max(0, a.start - 12), a.start)));
    const c = candidate(s, a, isRange ? b : null, from);
    if (isRange) i++;
    from = (isRange ? b : a).end;
    if (c) out.push(c);
  }
  return out;
}

/** The posting's salary: the first stated pay that is not on-target earnings, else the first OTE. */
export function salaryOf(segments: readonly Segment[]): SalaryValue | null {
  const all = segments.flatMap((seg) => salariesIn(seg.quote));
  return all.find((c) => !c.ote) ?? all[0] ?? null;
}
