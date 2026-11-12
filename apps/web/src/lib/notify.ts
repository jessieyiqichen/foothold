import { levelFor, type NudgeLevel } from "./nudges";

export const LAST_CALL = "22:30";
export const MAX_NOTIFICATIONS = 4;
/** Where a nudge leads: Today, marked as coming from a nudge, so Titi greets you and Start is one tap away. The calendar
 *  file's link uses the same address. */
export const NUDGE_PATH = "/?from=nudge";

export interface PlannedNotification {
  at: Date;
  level: NudgeLevel;
}

function atTime(now: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
}

/** The reminders still ahead today, plus one late last call after the latest chosen time. */
export function planNotifications(now: Date, times: string[]): PlannedNotification[] {
  const sorted = [...times].sort();
  const withLastCall = sorted.length > 0 && sorted[sorted.length - 1] < LAST_CALL ? [...sorted, LAST_CALL] : sorted;
  return withLastCall
    .map((t) => atTime(now, t))
    .filter((at) => at > now)
    .slice(0, MAX_NOTIFICATIONS)
    .map((at) => ({ at, level: levelFor(at.getHours()) }));
}
