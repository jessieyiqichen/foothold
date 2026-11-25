// "At a glance" on a role page (user, 2026-11-23): what the posting says, as short words in a two-column grid. The
// quotes stay in the card's "Why" layer and on the role rows. Pure.
import { postedLine } from "../matches/copy";
import { SIGNALS_COPY } from "../signals/copy";
import type { Signals, Visa } from "../signals/types";
import { ROLE_PAGE_COPY } from "./pageCopy";

export const MAX_GLANCE = 6;

export type GlanceKey = "years" | "visa" | "equity" | "k401" | "posted";

export interface GlanceCell {
  key: GlanceKey;
  label: string;
}

const VISA: Record<Visa, string> = { sponsors: SIGNALS_COPY.sponsors, no_sponsorship: SIGNALS_COPY.noSponsorship, citizens_only: SIGNALS_COPY.citizensOnly };

/** Years, visa, equity, 401(k) and the posting's age, each left out when unknown; at most MAX_GLANCE. */
export function glanceCells(signals: Signals | null | undefined, postedAt: string | null, now: Date = new Date()): GlanceCell[] {
  const years = signals?.years;
  const posted = postedLine(postedAt, now);
  const cells: (GlanceCell | null)[] = [
    years ? { key: "years", label: years.required ? `${years.min}+ years` : `${years.min}+ years ${ROLE_PAGE_COPY.preferred}` } : null,
    signals?.visa ? { key: "visa", label: VISA[signals.visa.value] } : null,
    signals?.equity ? { key: "equity", label: SIGNALS_COPY.equity } : null,
    signals?.k401 ? { key: "k401", label: SIGNALS_COPY.k401 } : null,
    posted ? { key: "posted", label: posted } : null,
  ];
  return cells.filter((cell): cell is GlanceCell => cell !== null).slice(0, MAX_GLANCE);
}
