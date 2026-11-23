// The Judge's rule-read signals from one posting's text (docs/judge-signals.md): years of experience, salary, visa,
// equity and 401(k), each with the sentence it comes from, copied character for character. What the rules cannot
// settle goes to `pending` for the model. No Deno or Node imports.

import { segmentsOf } from "./sentences.ts";
import { yearsOf, type YearsPending, type YearsValue } from "./years.ts";
import { salaryOf, type SalaryValue } from "./salary.ts";
import { visaOf, type VisaPending, type VisaValue } from "./visa.ts";
import { equityOf, k401Of, type FlagValue } from "./benefits.ts";

/** Raise when a rule changes: every posting is read again (fh_claim_signals compares the stored version). */
export const SIGNALS_VERSION = 2;

export type Pending = YearsPending | VisaPending;

export interface Signals {
  years: YearsValue | null;
  salary: SalaryValue | null;
  visa: VisaValue | null;
  equity: FlagValue | null;
  k401: FlagValue | null;
  pending: Pending[];
}

export type { FlagValue, SalaryValue, VisaValue, YearsPending, YearsValue, VisaPending };

export function extractSignals(text: string): Signals {
  const segments = segmentsOf(typeof text === "string" ? text : "");
  const years = yearsOf(segments);
  const visa = visaOf(segments);
  return {
    years: years.years,
    salary: salaryOf(segments),
    visa: visa.visa,
    equity: equityOf(segments),
    k401: k401Of(segments),
    pending: [...years.pending, ...visa.pending],
  };
}
