import type { Family, Level } from "../profile/roles";
import type { Decision, PersonSource } from "./constants";

/** A role on a card: the evidence that the company fits. */
export interface CardRole {
  id: string;
  title: string;
  /** Always https. */
  url: string;
  postedAt: string | null;
  family: Family;
  level: Level;
  shared: string[];
}

/** The one person to reach at a company, only through a route they published themself. */
export interface CardPerson {
  name: string;
  role: string | null;
  contactKind: "email" | "url";
  /** The address or the page, as shown. */
  contact: string;
  /** What the link opens: `mailto:` for an email, an https page otherwise. */
  href: string;
  source: PersonSource;
  /** Where the person was found; null when that link is not https (the source is still named). */
  sourceUrl: string | null;
  seenAt: string;
}

/** One company card: one company, one person, one message (docs/architecture.md). */
export interface CompanyCard {
  companyId: number;
  name: string;
  oneLiner: string | null;
  website: string | null;
  teamSize: number | null;
  batch: string | null;
  stage: string | null;
  investors: string[];
  lastPostedAt: string | null;
  recentRoles: number | null;
  shared: string[];
  score: number;
  roles: CardRole[];
  person: CardPerson | null;
}

export interface SavedCard extends CompanyCard {
  decision: Exclude<Decision, "skipped">;
  decidedAt: string;
}

/** A decision as read back from the person's own rows. */
export interface DecisionRow {
  companyId: number;
  decision: Decision;
  decidedAt: string;
}
