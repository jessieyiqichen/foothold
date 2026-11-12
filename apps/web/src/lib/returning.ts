import { daysBetween, formatShortDate, toISODate } from "./dates";
import type { TodayPlan } from "./quota";
import type { Session } from "./types";

/** A Start from another day no longer asks "how many?": that answer would land on the wrong day. */
export function sessionIsToday(session: Session | null, today: string): boolean {
  return session !== null && toISODate(new Date(session.startedAt)) === today;
}

/** When coming back behind on a by-date goal, say why today's number is bigger than usual. */
export function catchUpLine(plan: TodayPlan): string | null {
  if (plan.behindBy <= 0 || plan.daysLeft === null || plan.daysLeft <= 0) return null;
  if (plan.daysLeft === 1) return `The rest is due today, ${plan.quota} to go`;
  return `The rest is spread over ${plan.daysLeft} days, ${plan.quota} today`;
}

const WARN_DAYS_BEFORE = 2;
const STOP_AFTER_DAYS = 30;

/** The downloaded calendar file only covers a couple of weeks; say so just before and after it runs out. */
export function calendarNotice(until: string | null, today: string): string | null {
  if (!until) return null;
  const left = daysBetween(today, until);
  if (left > WARN_DAYS_BEFORE || left < -STOP_AFTER_DAYS) return null;
  return left >= 0 ? `Your calendar nudges end ${formatShortDate(until)}, grab a new file` : `Your calendar nudges ended ${formatShortDate(until)}, grab a new file`;
}
