import type { Family, Level } from "../profile/roles";
import type { Signals } from "../signals/types";
import type { Decision, PersonSource } from "./constants";

/** A role on a card: the evidence that the company fits. */
export interface CardRole {
  id: string;
  /** Null for a Hacker News post that gave none; shown as where the role came from (roleTitle). */
  title: string | null;
  /** Always https. */
  url: string;
  postedAt: string | null;
  /** Null for a role not labelled yet. */
  family: Family | null;
  level: Level;
  shared: string[];
  /** What the posting's own text says, each with its quote; absent when it says none or could not be read. */
  signals?: Signals;
}

/** The one person to reach at a company, only through a route they published themself. */
export interface CardPerson {
  /** Null when the source gave no name (most Hacker News posters); shown as personName says. */
  name: string | null;
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
  /** The company's page in the YC directory, where its founders are listed: a link only, no contacts are taken from
   *  it. Always https on www.ycombinator.com, or null. */
  foundersUrl: string | null;
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
