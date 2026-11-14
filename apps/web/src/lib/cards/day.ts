// "Today" and the count on a card. Today is the person's own calendar day, in their browser's time zone, from local
// midnight; the count is how many decisions they made since then, read back from their own rows, so it survives a
// reload and another tab. Cards come in fives; after each five comes the done screen.
import { ROUND_SIZE, type Decision } from "./constants";

/** Midnight at the start of `now`'s day, where the person is. */
export function localDayStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "Card N of M": N is the decisions made today plus one, M the end of the current five. */
export function cardPosition(decidedToday: number): { n: number; of: number } {
  return { n: decidedToday + 1, of: (Math.floor(decidedToday / ROUND_SIZE) + 1) * ROUND_SIZE };
}

/** How many cards to ask for to finish the current five. */
export const remainingInRound = (decidedToday: number): number => ROUND_SIZE - (decidedToday % ROUND_SIZE);

/** Whether to show the done screen: right after a five is finished, unless the person already asked for five more
 *  at this count (`continuedAt`). */
export const roundDone = (decidedToday: number, continuedAt: number | null): boolean =>
  decidedToday > 0 && decidedToday % ROUND_SIZE === 0 && continuedAt !== decidedToday;

export interface Tally {
  saved: number;
  reached_out: number;
  skipped: number;
  total: number;
}

export function tally(decisions: readonly Decision[]): Tally {
  const count = (kind: Decision) => decisions.filter((d) => d === kind).length;
  return { saved: count("saved"), reached_out: count("reached_out"), skipped: count("skipped"), total: decisions.length };
}

/** "Today's done: you saved 2 and reached out to 1": outreach is the progress (docs/architecture.md), so skips are
 *  only mentioned when there is nothing else. */
export function doneLine({ saved, reached_out: reached, total }: Tally): string {
  const parts = [saved > 0 ? `saved ${saved}` : "", reached > 0 ? `reached out to ${reached}` : ""].filter(Boolean);
  if (parts.length === 0) return `Today's done: you looked at ${total} ${total === 1 ? "company" : "companies"}`;
  return `Today's done: you ${parts.join(" and ")}`;
}
