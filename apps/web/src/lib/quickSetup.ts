import { daysBetween } from "./dates";
import { amountTiers, dateOptions, perDayFor, splitAction, type DateOption } from "./onboarding";
import { STARTERS, type Site } from "./starters";
import type { GoalType } from "./types";
import { countError, MAX_TARGET, validateGoal, type GoalValues } from "./validate";

/** The one-screen first visit (user, 2026-10-18, after the teacher's "the page is the onboarding"): three rows of
 *  one-tap choices with sensible ones already picked, so today's number is on the first screen. */
export interface Picks {
  /** A starter's key, or "own" for something of your own. */
  starter: string;
  ownText: string;
  ownType: GoalType;
  /** A date option's key, or "pick". */
  when: string;
  pickedDate: string;
  /** 0 to 2 for Easy start, Steady, Go big, or "own". */
  tier: number | "own";
  ownAmount: string;
  /** A site's key for a goal that offers sites, or "none"; "" means the first one. */
  site: string;
}

export const FIRST_PICKS: Picks = { starter: "linkedin", ownText: "", ownType: "daily", when: "1m", pickedDate: "", tier: 1, ownAmount: "", site: "" };

const NO_SITE: Site = { key: "none", label: "No site", link: null };

export interface Tier {
  label: string;
  amount: number;
  perDay: number;
}

export interface Resolved {
  type: GoalType;
  /** "" for a daily goal. */
  deadline: string;
  dates: DateOption[];
  tiers: Tier[];
  /** Sites to pick from (job applications), with "No site" last; empty when the goal offers none. */
  sites: Site[];
  /** The key of the site in use, or "". */
  site: string;
  /** Today's number, once the picks make sense. */
  perDay: number | null;
  verb: string;
  unit: string;
  errors: { what?: string; date?: string; amount?: string };
  /** The goal to save, or null while something is missing. */
  goal: GoalValues | null;
}

function checkWhat(text: string): string | undefined {
  if (!text.trim()) return 'Enter what you\'ll do, like "Send cold emails"';
  if (text.trim().length > 60) return "Keep it under 60 characters";
}

function checkDate(date: string, today: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Pick the date you want to finish by";
  if (date <= today) return "Pick a date after today";
}

/** A typed number, with an example the size of this goal's own middle choice. */
function checkAmount(text: string, example: number): string | undefined {
  const error = countError(text, example);
  if (error) return error;
  if (Number(text) > MAX_TARGET) return "Enter a number up to 100,000";
}

export function resolveSetup(picks: Picks, today: string): Resolved {
  const starter = STARTERS.find((s) => s.key === picks.starter) ?? null;
  const type = starter ? starter.type : picks.ownType;
  const { verb, unit } = starter ? { verb: starter.verb, unit: starter.unit } : splitAction(picks.ownText);
  const dates = dateOptions(today);
  const chosen = dates.find((d) => d.key === picks.when) ?? dates[1];
  const deadline = type !== "by-date" ? "" : picks.when === "pick" ? picks.pickedDate : chosen.date;

  const errors: Resolved["errors"] = {};
  if (!starter) errors.what = checkWhat(picks.ownText);
  if (type === "by-date" && picks.when === "pick") errors.date = checkDate(deadline, today);
  const days = type === "by-date" && !errors.date ? daysBetween(today, deadline) + 1 : 1;
  const tiers = amountTiers(type, starter?.key ?? null, days).map((t) => ({ ...t, perDay: perDayFor(type, t.amount, deadline, today) }));
  if (picks.tier === "own") errors.amount = checkAmount(picks.ownAmount, tiers[1].amount);
  const clean = Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Resolved["errors"];

  const sites = starter?.sites ? [...starter.sites, NO_SITE] : [];
  const site = sites.find((x) => x.key === picks.site) ?? sites[0] ?? null;
  const link = site ? site.link : (starter?.link ?? null);

  const amount = picks.tier === "own" ? Number(picks.ownAmount) : tiers[picks.tier].amount;
  const ready = Object.keys(clean).length === 0;
  const goal = ready ? validateGoal({ verb, unit, type, target: String(amount), deadline, link: link ?? "" }, today).value : null;
  const perDay = goal ? perDayFor(type, amount, deadline, today) : null;
  return { type, deadline, dates, tiers, sites, site: site?.key ?? "", perDay, verb, unit, errors: clean, goal };
}
