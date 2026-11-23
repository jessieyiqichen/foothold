// What a posting's own text says about a role (docs/judge-signals.md): each value with the sentence it was read from.
// Keys are absent when the posting does not say, or when the answer could not be read.

export const VISA_VALUES = ["sponsors", "no_sponsorship", "citizens_only"] as const;
export type Visa = (typeof VISA_VALUES)[number];

export const SALARY_PERIODS = ["year", "hour"] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export interface Years {
  min: number;
  /** False when the posting only prefers the years: shown, never as a warning. */
  required: boolean;
  /** The role needs experience: required and at least NEEDS_YEARS_MIN years, or the row's own needs_years. Only this
   *  takes the warning tone, as only this is sorted lower and hidden by the server. */
  needs: boolean;
  quote: string;
}

export interface Salary {
  min: number | null;
  max: number | null;
  /** ISO 4217, e.g. USD. */
  currency: string;
  period: SalaryPeriod;
  /** On-target earnings, not a base salary. */
  ote: boolean;
  quote: string;
}

export interface Signals {
  years?: Years;
  salary?: Salary;
  visa?: { value: Visa; quote: string };
  equity?: { quote: string };
  k401?: { quote: string };
}

export type SignalKey = keyof Signals;
