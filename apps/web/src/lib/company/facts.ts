// The company facts table on a role page (user, 2026-11-23): a label left, the value right, only rows with data.
// Pure; the same facts the card's "How they're doing" lines read, so both say the same thing.
import { ageLine } from "../cards/age";
import { headCountOf, investorNames, stageWords } from "../cards/copy";
import type { CompanyCard } from "../cards/types";
import { peopleLine, ROLE_PAGE_COPY } from "./pageCopy";

export type FactKey = "stage" | "batch" | "team" | "investors" | "recent" | "posted" | "website";

export interface FactRow {
  key: FactKey;
  label: string;
  value: string;
  /** Only the website: where the value links to, always https. */
  href?: string;
}

export type FactsInput = Pick<CompanyCard, "stage" | "batch" | "teamSize" | "investors" | "recentRoles" | "lastPostedAt" | "website">;

/** "acme.ai" from "https://www.acme.ai/about". */
const hostOf = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

/** The rows, in a fixed order: stage, batch, team size, investors, roles posted in the last 60 days, last posted,
 *  website. A row with no data is left out; no data at all gives an empty list. */
export function factRows(facts: FactsInput, now: Date = new Date()): FactRow[] {
  const stage = stageWords(facts.stage);
  const people = headCountOf(facts);
  const posted = ageLine(facts.lastPostedAt, now);
  const rows: (FactRow | null)[] = [
    stage ? { key: "stage", label: ROLE_PAGE_COPY.stage, value: stage } : null,
    facts.batch ? { key: "batch", label: ROLE_PAGE_COPY.batch, value: facts.batch } : null,
    people ? { key: "team", label: ROLE_PAGE_COPY.team, value: peopleLine(people) } : null,
    facts.investors.length > 0 ? { key: "investors", label: ROLE_PAGE_COPY.investors, value: investorNames(facts.investors) } : null,
    facts.recentRoles && facts.recentRoles > 0 ? { key: "recent", label: ROLE_PAGE_COPY.recent, value: String(facts.recentRoles) } : null,
    posted ? { key: "posted", label: ROLE_PAGE_COPY.posted, value: posted } : null,
    facts.website ? { key: "website", label: ROLE_PAGE_COPY.website, value: hostOf(facts.website), href: facts.website } : null,
  ];
  return rows.filter((row): row is FactRow => row !== null);
}
