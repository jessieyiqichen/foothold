const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `then` to `now`, never below zero. */
export const daysBetween = (then: Date, now: Date): number => Math.max(0, Math.floor((now.getTime() - then.getTime()) / DAY_MS));

/** "today", "4 days ago", "3 weeks ago", "2 months ago", "over a year ago"; nothing when the date is unknown. */
export function ageLine(iso: string | null, now: Date = new Date()): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "";
  const days = daysBetween(new Date(iso), now);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 60) return days < 14 ? "1 week ago" : `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return "over a year ago";
}
