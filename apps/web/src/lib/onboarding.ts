import { addDays, daysBetween, toISODate } from "./dates";
import type { GoalType } from "./types";

/** First-visit setup, one question per screen. These are suggestions to tap; every one can be changed later. */

export interface DateOption {
  key: string;
  label: string;
  date: string;
}

export interface AmountTier {
  label: string;
  amount: number;
}

const TIER_LABELS = ["Easy start", "Steady", "Go big"];
/** Totals for LinkedIn, the one starter that is a total by a date. */
const TOTALS: Record<string, number[]> = { linkedin: [50, 150, 300] };
/** A day's number at each tier; a by-date goal of your own turns these into totals for the days you have. */
const DAILY = [1, 3, 5];
/** Thanksgiving is offered when it is between one week and about ten weeks away. */
const HOLIDAY_WINDOW = { min: 7, max: 75 };

/** US Thanksgiving: the fourth Thursday of November. */
export function thanksgiving(year: number): string {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay(); // 0 = Sunday
  const firstThursday = 1 + ((4 - first + 7) % 7);
  return `${year}-11-${String(firstThursday + 21).padStart(2, "0")}`;
}

/** The same day next month, or the month's last day when it is shorter. */
export function addMonth(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return toISODate(new Date(y, m, Math.min(d, lastDay)));
}

export function dateOptions(today: string): DateOption[] {
  const options: DateOption[] = [
    { key: "2w", label: "In 2 weeks", date: addDays(today, 14) },
    { key: "1m", label: "In a month", date: addMonth(today) },
  ];
  const holiday = thanksgiving(Number(today.slice(0, 4)));
  const away = daysBetween(today, holiday);
  if (away >= HOLIDAY_WINDOW.min && away <= HOLIDAY_WINDOW.max && holiday !== options[1].date) {
    options.push({ key: "thanksgiving", label: "Before Thanksgiving", date: holiday });
  }
  return options;
}

/** `days` counts today through the deadline; it only matters for a by-date goal of your own. */
export function amountTiers(type: GoalType, starterKey: string | null, days = 1): AmountTier[] {
  const fixed = type === "by-date" && starterKey ? TOTALS[starterKey] : undefined;
  const amounts = fixed ?? (type === "daily" ? DAILY : DAILY.map((n) => n * days));
  return amounts.map((amount, i) => ({ label: TIER_LABELS[i], amount }));
}

/** How many a day a choice means, counting today, the same way Today works it out. */
export function perDayFor(type: GoalType, amount: number, deadline: string, today: string): number {
  if (type === "daily") return amount;
  return Math.ceil(amount / (daysBetween(today, deadline) + 1));
}

/** "send cold emails" → verb "Send", unit "cold emails". One word means you count times. */
export function splitAction(text: string): { verb: string; unit: string } {
  const [first = "", ...rest] = text.trim().split(/\s+/).filter(Boolean);
  const verb = first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
  return { verb, unit: rest.join(" ").toLowerCase() };
}
