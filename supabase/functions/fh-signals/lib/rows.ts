// The signals worker's pure part around the database: what a call may ask for, what a claimed or stored row must look
// like, and the flat row handed to fh_set_signals. No Deno or Node imports. Nothing from outside is trusted: a row
// that does not have the shape it should is dropped, never guessed at.

import type { Pending, Signals } from "./extract.ts";
import { QUOTE_MAX } from "./sentences.ts";
import { BOUNDS, type Period } from "./salary.ts";
import { VISAS, type Visa } from "./visa.ts";
import { YEARS_MAX } from "./years.ts";

export const RULES_LIMIT_DEFAULT = 500;
/** Kept under the 1,000 rows the API returns at most, so "fewer than asked" can only mean the end was reached. */
export const RULES_LIMIT_MAX = 500;
export const MODEL_LIMIT_DEFAULT = 50;
export const MODEL_LIMIT_MAX = 50;
/** Failed model requests a row may have; at this count fh_signals_model_failed clears its pending and the rules'
 *  values stand, so a batch whose reply always fails cannot block the queue. The table repeats it in a check. */
export const MODEL_TRIES_MAX = 3;
/** The table refuses more; a posting with more candidate sentences keeps the first ones. */
export const PENDING_MAX = 20;

/** The batch size asked for, inside 1..max; the default when it is not a whole number. */
export function pickLimit(value: unknown, fallback: number, max: number): number {
  return typeof value === "number" && Number.isInteger(value) ? Math.min(Math.max(value, 1), max) : fallback;
}

export interface Claimed {
  id: number;
  md5: string;
  /** null: the text is unchanged since it was last read (fh_claim_signals has already marked it checked) */
  text: string | null;
}

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1;
const isMd5 = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{32}$/.test(v);
const isQuote = (v: unknown): v is string => typeof v === "string" && v.length >= 1 && v.length <= QUOTE_MAX;
const record = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Rows from fh_claim_signals. A row without a whole-number id or an md5 is dropped. */
export function readClaimed(data: unknown): Claimed[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((raw): Claimed[] => {
    const r = record(raw);
    if (!r || !isId(r.posting_id) || !isMd5(r.text_md5)) return [];
    return [{ id: r.posting_id, md5: r.text_md5, text: typeof r.text === "string" && r.text.length > 0 ? r.text : null }];
  });
}

/** The columns of fh_posting_signals that a write sets. */
export interface SignalRow {
  posting_id: number;
  text_md5: string;
  years_min: number | null;
  years_required: boolean | null;
  years_quote: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: Period | null;
  salary_ote: boolean | null;
  salary_quote: string | null;
  visa: Visa | null;
  visa_quote: string | null;
  equity: true | null;
  equity_quote: string | null;
  k401: true | null;
  k401_quote: string | null;
  pending: Pending[] | null;
  settled_by: string;
}

/** One posting's signals as the flat row the table stores. */
export function toRow(id: number, md5: string, s: Signals, settledBy: string): SignalRow {
  const pending = s.pending.slice(0, PENDING_MAX);
  return {
    posting_id: id, text_md5: md5,
    years_min: s.years?.min ?? null, years_required: s.years ? s.years.required : null, years_quote: s.years?.quote ?? null,
    salary_min: s.salary?.min ?? null, salary_max: s.salary ? s.salary.max : null, salary_currency: s.salary?.currency ?? null,
    salary_period: s.salary?.period ?? null, salary_ote: s.salary ? s.salary.ote : null, salary_quote: s.salary?.quote ?? null,
    visa: s.visa?.value ?? null, visa_quote: s.visa?.quote ?? null,
    equity: s.equity ? true : null, equity_quote: s.equity?.quote ?? null,
    k401: s.k401 ? true : null, k401_quote: s.k401?.quote ?? null,
    pending: pending.length > 0 ? pending : null, settled_by: settledBy,
  };
}

export interface Stored {
  id: number;
  md5: string;
  settledBy: string;
  signals: Signals;
}

function pendingOf(v: unknown): Pending[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > PENDING_MAX) return null;
  const out: Pending[] = [];
  for (const raw of v) {
    const p = record(raw);
    if (!p || !isQuote(p.sentence)) return null;
    if (p.kind === "visa") out.push({ kind: "visa", sentence: p.sentence });
    else if (p.kind === "years" && Number.isInteger(p.value) && (p.value as number) >= 0 && (p.value as number) <= YEARS_MAX) {
      out.push({ kind: "years", sentence: p.sentence, value: p.value as number });
    } else return null;
  }
  return out;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^\d+(\.\d+)?$/.test(v) ? Number(v) : null);

/** undefined: the stored value is there but malformed, so the row must not be rewritten from what was read */
type Read<T> = T | null | undefined;

function salaryFrom(r: Record<string, unknown>): Read<Signals["salary"]> {
  if (r.salary_min === null && r.salary_quote === null) return null;
  const min = num(r.salary_min);
  const period = r.salary_period === "year" || r.salary_period === "hour" ? r.salary_period : null;
  if (min === null || period === null || !isQuote(r.salary_quote) || typeof r.salary_currency !== "string") return undefined;
  const max = r.salary_max === null ? null : num(r.salary_max);
  if (max === null && r.salary_max !== null) return undefined;
  if (min < BOUNDS[period].min || min > BOUNDS[period].max) return undefined;
  return { min, max, currency: r.salary_currency, period, ote: r.salary_ote === true, quote: r.salary_quote };
}

function yearsFrom(r: Record<string, unknown>): Read<Signals["years"]> {
  if (r.years_min === null && r.years_quote === null) return null;
  const min = num(r.years_min);
  if (min === null || !Number.isInteger(min) || !isQuote(r.years_quote) || typeof r.years_required !== "boolean") return undefined;
  return { min, required: r.years_required, quote: r.years_quote };
}

function visaFrom(r: Record<string, unknown>): Read<Signals["visa"]> {
  if (r.visa === null && r.visa_quote === null) return null;
  return VISAS.includes(r.visa as Visa) && isQuote(r.visa_quote) ? { value: r.visa as Visa, quote: r.visa_quote } : undefined;
}

function flagFrom(value: unknown, quote: unknown): Read<{ quote: string }> {
  if (value === null && quote === null) return null;
  return value === true && isQuote(quote) ? { quote } : undefined;
}

/** A stored row with pending sentences, as the model task reads it. Dropped (null) when any part is malformed, so a
 *  rewrite can never erase a value it failed to read. */
export function readStored(raw: unknown): Stored | null {
  const r = record(raw);
  if (!r || !isId(r.posting_id) || !isMd5(r.text_md5) || typeof r.settled_by !== "string") return null;
  const pending = pendingOf(r.pending);
  const years = yearsFrom(r);
  const salary = salaryFrom(r);
  const visa = visaFrom(r);
  const equity = flagFrom(r.equity, r.equity_quote);
  const k401 = flagFrom(r.k401, r.k401_quote);
  if (!pending || years === undefined || salary === undefined || visa === undefined || equity === undefined || k401 === undefined) return null;
  return { id: r.posting_id, md5: r.text_md5, settledBy: r.settled_by, signals: { years, salary, visa, equity, k401, pending } };
}

/** True when this call read the last rows: fewer came back than were asked for. */
export const reachedEnd = (read: number, limit: number): boolean => read < limit;

export interface SetResult {
  /** rows written with their values */
  written: number;
  /** rows written empty: a quote or pending sentence was not in the text */
  emptied: number;
  /** rows not written: the text changed since the claim, the posting is gone, or a newer version is stored */
  skipped: number;
}

/** fh_set_signals' answer; a count that is not a whole number of 0 or more reads as 0. */
export function readSetResult(data: unknown): SetResult {
  const r = record(data) ?? {};
  const n = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0);
  return { written: n(r.written), emptied: n(r.emptied), skipped: n(r.skipped) };
}
