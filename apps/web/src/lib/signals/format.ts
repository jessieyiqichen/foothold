// One short line of signals per role, and the quote each comes from, shown on demand. Pure.
import { CURRENCY_SIGNS, EARLY_LEVELS, LATE_LEVELS } from "./constants";
import { SIGNALS_COPY } from "./copy";
import type { Salary, SalaryPeriod, SignalKey, Signals, Visa, Years } from "./types";

export interface SignalItem {
  key: SignalKey;
  label: string;
  quote: string;
  /** Only years the role needs (Years.needs): the line takes a muted warning tone. */
  warn: boolean;
}

/** "Needs 4+ years" (the role needs experience), "2+ years experience" (required, but within new grad), "Prefers 3+
 *  years" (preferred only). */
export function yearsLabel(years: Years): string {
  if (years.needs) return `${SIGNALS_COPY.needs} ${years.min}+ years`;
  if (years.required) return `${years.min}+ ${SIGNALS_COPY.yearsExperience}`;
  return `${SIGNALS_COPY.prefers} ${years.min}+ years`;
}

const trimmed = (n: number, digits: number): string => String(Number(n.toFixed(digits)));

/** An amount as a line says it: a year's pay in thousands or millions ("120k", "1.25M"), an hour's to the cent when
 *  it has cents ("40", "62.50"). */
export function money(n: number, period: SalaryPeriod): string {
  if (period === "hour") return Number.isInteger(n) ? String(n) : n.toFixed(2);
  if (n >= 1_000_000) return `${trimmed(n / 1_000_000, 2)}M`;
  if (n >= 1_000) return `${trimmed(n / 1_000, 1)}k`;
  return String(Math.round(n));
}

export function salaryLabel(salary: Salary): string {
  const sign = CURRENCY_SIGNS[salary.currency] ?? `${salary.currency} `;
  const at = (n: number) => `${sign}${money(n, salary.period)}`;
  const { min, max } = salary;
  const range = min !== null && max !== null
    ? (min === max ? at(min) : `${at(min)}–${at(max)}`)
    : min !== null ? `${SIGNALS_COPY.from} ${at(min)}` : `${SIGNALS_COPY.upTo} ${at(max as number)}`;
  return [range, salary.period === "hour" ? SIGNALS_COPY.anHour : "", salary.ote ? SIGNALS_COPY.ote : ""].filter(Boolean).join(" ");
}

const VISA_LABEL: Record<Visa, string> = {
  sponsors: SIGNALS_COPY.sponsors,
  no_sponsorship: SIGNALS_COPY.noSponsorship,
  citizens_only: SIGNALS_COPY.citizensOnly,
};

/** The signals in a fixed order: years, salary, visa, equity, 401(k). Empty when there are none. */
export function signalItems(signals: Signals | null | undefined): SignalItem[] {
  if (!signals) return [];
  const items: SignalItem[] = [];
  const { years, salary, visa, equity, k401 } = signals;
  if (years) items.push({ key: "years", label: yearsLabel(years), quote: years.quote, warn: years.needs });
  if (salary) items.push({ key: "salary", label: salaryLabel(salary), quote: salary.quote, warn: false });
  if (visa) items.push({ key: "visa", label: VISA_LABEL[visa.value], quote: visa.quote, warn: false });
  if (equity) items.push({ key: "equity", label: SIGNALS_COPY.equity, quote: equity.quote, warn: false });
  if (k401) items.push({ key: "k401", label: SIGNALS_COPY.k401, quote: k401.quote, warn: false });
  return items;
}

export const signalTone = (signals: Signals | null | undefined): "warn" | "plain" => (signals?.years?.needs ? "warn" : "plain");

export const quoteLine = (quote: string): string => `${SIGNALS_COPY.fromPosting} “${quote}”`;

/** Whether the server hides roles needing years when the filter is left to it: a person whose levels include intern or
 *  entry and not senior or management (docs/judge-signals.md). Mirrors fh_roles' default so the toggle shows it. */
export function hidesYearsByDefault(levels: readonly string[]): boolean {
  const has = (list: readonly string[]) => list.some((level) => levels.includes(level));
  return has(EARLY_LEVELS) && !has(LATE_LEVELS);
}
