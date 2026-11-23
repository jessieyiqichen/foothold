// The `signals` jsonb from fh_roles, fh_public_roles, fh_company and fh_public_company, checked key by key before the
// page shows anything. A missing or malformed answer is "no signals" (the functions may predate the migration), and
// one bad key never takes the others with it. A value is kept only with its quote (docs/judge-signals.md).
import { MAX_QUOTE, MAX_YEARS, NEEDS_YEARS_MIN } from "./constants";
import { SALARY_PERIODS, VISA_VALUES, type Salary, type SalaryPeriod, type Signals, type Visa, type Years } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The sentence, trimmed, when it is 1 to MAX_QUOTE characters; else null. */
function quoteOf(value: unknown): string | null {
  if (!isRecord(value) || typeof value.quote !== "string") return null;
  const quote = value.quote.trim();
  return quote.length > 0 && quote.length <= MAX_QUOTE ? quote : null;
}

/** `needsYears` is the row's needs_years when it is a boolean; otherwise the same rule as the server's. */
function readYears(value: unknown, needsYears: unknown): Years | null {
  const quote = quoteOf(value);
  if (!quote || !isRecord(value)) return null;
  const { min, required } = value;
  if (typeof min !== "number" || !Number.isInteger(min) || min < 1 || min > MAX_YEARS || typeof required !== "boolean") return null;
  const needs = typeof needsYears === "boolean" ? needsYears : required && min >= NEEDS_YEARS_MIN;
  return { min, required, needs, quote };
}

/** An amount, null when absent; undefined when it is there but not a positive finite number. */
function amountOf(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function readSalary(value: unknown): Salary | null {
  const quote = quoteOf(value);
  if (!quote || !isRecord(value)) return null;
  const min = amountOf(value.min);
  const max = amountOf(value.max);
  const { currency, period } = value;
  const ote = value.ote ?? false;
  if (min === undefined || max === undefined || (min === null && max === null) || (min !== null && max !== null && min > max)) return null;
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return null;
  if (!(SALARY_PERIODS as readonly unknown[]).includes(period) || typeof ote !== "boolean") return null;
  return { min, max, currency, period: period as SalaryPeriod, ote, quote };
}

function readVisa(value: unknown): Signals["visa"] | null {
  const quote = quoteOf(value);
  if (!quote || !isRecord(value) || !(VISA_VALUES as readonly unknown[]).includes(value.value)) return null;
  return { value: value.value as Visa, quote };
}

function readFlag(value: unknown): { quote: string } | null {
  const quote = quoteOf(value);
  return quote ? { quote } : null;
}

/** The readable signals, or null when there are none. `needsYears` is the row's needs_years, beside `signals`. */
export function readSignals(value: unknown, needsYears?: unknown): Signals | null {
  if (!isRecord(value)) return null;
  const read = {
    years: readYears(value.years, needsYears),
    salary: readSalary(value.salary),
    visa: readVisa(value.visa),
    equity: readFlag(value.equity),
    k401: readFlag(value.k401),
  };
  const kept = Object.fromEntries(Object.entries(read).filter(([, signal]) => signal !== null)) as Signals;
  return Object.keys(kept).length > 0 ? kept : null;
}
