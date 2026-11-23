// The five filters on what a posting's own text says (docs/judge-signals.md): hide roles needing years of experience,
// visa, minimum salary, equity, 401(k). Kept in the URL like the others. Their database parameters are sent only when
// a filter is on (null means off on the server), so a database that predates them still answers the unfiltered list.
// Pure.
import { hidesYearsByDefault } from "../signals/format";
import { SALARY_CHOICES, VISA_FILTERS, type SalaryChoice, type VisaFilter } from "./constants";
import { ROLES_COPY } from "./copy";

export interface SignalFilters {
  /** null: the server's default, on for an intern or entry profile (hidesYearsByDefault). */
  hideYears: boolean | null;
  visa: VisaFilter | null;
  /** USD a year; null: any. */
  minSalary: SalaryChoice;
  equity: boolean;
  k401: boolean;
}

export const DEFAULT_SIGNAL_FILTERS: SignalFilters = { hideYears: null, visa: null, minSalary: null, equity: false, k401: false };

const KEYS = { hideYears: "years", visa: "visa", minSalary: "salary", equity: "equity", k401: "401k" } as const;
const ON = "1";

const salaryParam = (n: number): string => `${n / 1000}k`;

function parseSalary(raw: string | null): SalaryChoice {
  return SALARY_CHOICES.find((n) => salaryParam(n) === raw) ?? null;
}

export function parseSignalFilters(params: URLSearchParams): SignalFilters {
  const years = params.get(KEYS.hideYears);
  const visa = params.get(KEYS.visa);
  return {
    hideYears: years === "hide" ? true : years === "show" ? false : null,
    visa: (VISA_FILTERS as readonly (string | null)[]).includes(visa) ? (visa as VisaFilter) : null,
    minSalary: parseSalary(params.get(KEYS.minSalary)),
    equity: params.get(KEYS.equity) === ON,
    k401: params.get(KEYS.k401) === ON,
  };
}

/** Adds to `params` only what differs from the defaults. */
export function writeSignalFilters(params: URLSearchParams, filters: SignalFilters): void {
  if (filters.hideYears !== null) params.set(KEYS.hideYears, filters.hideYears ? "hide" : "show");
  if (filters.visa) params.set(KEYS.visa, filters.visa);
  if (filters.minSalary !== null) params.set(KEYS.minSalary, salaryParam(filters.minSalary));
  if (filters.equity) params.set(KEYS.equity, ON);
  if (filters.k401) params.set(KEYS.k401, ON);
}

/** The new parameters of fh_roles, fh_public_roles and fh_roles_facets, each only when its filter is on. The server
 *  reads a missing p_hide_years as off, so the profile's default is sent as true here (`levels`: the profile's). */
export function signalArgs(filters: SignalFilters, levels: readonly string[]) {
  return {
    ...(effectiveHideYears(filters, levels) ? { p_hide_years: true } : {}),
    ...(filters.visa ? { p_visa: filters.visa } : {}),
    ...(filters.minSalary !== null ? { p_min_salary: filters.minSalary } : {}),
    ...(filters.equity ? { p_equity: true } : {}),
    ...(filters.k401 ? { p_k401: true } : {}),
  };
}

export const effectiveHideYears = (filters: SignalFilters, levels: readonly string[]): boolean => filters.hideYears ?? hidesYearsByDefault(levels);

/** The years filter switched; set back to null when that is what the default is, so the URL and the request stay
 *  clean and the server keeps deciding. */
export function withHideYears<T extends SignalFilters>(filters: T, levels: readonly string[], on: boolean): T {
  return { ...filters, hideYears: on === hidesYearsByDefault(levels) ? null : on };
}

/** Every signal filter off. The years filter is off explicitly only where the default would turn it on. */
export const clearedSignals = (levels: readonly string[]): SignalFilters =>
  ({ ...DEFAULT_SIGNAL_FILTERS, hideYears: hidesYearsByDefault(levels) ? false : null });

export const salaryChoiceLabel = (n: SalaryChoice): string => (n === null ? ROLES_COPY.any : `$${n / 1000}k`);
export const visaChoiceLabel = (v: VisaFilter | null): string =>
  v === null ? ROLES_COPY.any : v === "sponsors" ? ROLES_COPY.visaSponsors : ROLES_COPY.visaNoCitizens;
export const visaTrigger = (v: VisaFilter | null): string => (v === null ? ROLES_COPY.visa : visaChoiceLabel(v));
export const salaryTrigger = (n: SalaryChoice): string => (n === null ? ROLES_COPY.minSalary : `${salaryChoiceLabel(n)}+`);

export interface SignalChip<T> { key: string; label: string; without: T }

/** What the person set here, in the toolbar's order. The years filter left to its default is not a chip. */
export function signalChips<T extends SignalFilters>(filters: T): SignalChip<T>[] {
  const chips: SignalChip<T>[] = [];
  if (filters.hideYears !== null) {
    chips.push({ key: "years", label: filters.hideYears ? ROLES_COPY.hidingYears : ROLES_COPY.showingYears, without: { ...filters, hideYears: null } });
  }
  if (filters.visa) {
    chips.push({ key: "visa", label: filters.visa === "sponsors" ? ROLES_COPY.visaSponsors : ROLES_COPY.hidingCitizens, without: { ...filters, visa: null } });
  }
  if (filters.minSalary !== null) chips.push({ key: "salary", label: `Salary ${salaryTrigger(filters.minSalary)}`, without: { ...filters, minSalary: null } });
  if (filters.equity) chips.push({ key: "equity", label: ROLES_COPY.equity, without: { ...filters, equity: false } });
  if (filters.k401) chips.push({ key: "401k", label: ROLES_COPY.k401, without: { ...filters, k401: false } });
  return chips;
}

/** How many signal filters narrow the list, the default years filter included. */
export function signalNarrowing(filters: SignalFilters, levels: readonly string[]): number {
  return [effectiveHideYears(filters, levels), filters.visa !== null, filters.minSalary !== null, filters.equity, filters.k401].filter(Boolean).length;
}
