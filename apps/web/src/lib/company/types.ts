import type { Decision } from "../cards/constants";
import type { CompanyCard } from "../cards/types";

/** One company's page: the card with every open role, the role that fits best, and the person's own decision. */
export interface CompanyPage {
  card: CompanyCard;
  /** The id of the role that fits the person best (the card's first role), or null when none fits. */
  bestRole: string | null;
  decision: Decision | null;
  decidedAt: string | null;
}

/** How a page was asked for: by the company, or by one of its roles (from All roles), which is then chosen. */
export type CompanyBy = { company: number } | { role: number };
