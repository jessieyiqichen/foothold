import type { CompanyCard } from "./types";

/** The ways in shown under "Who to contact": the person when there is one, with the founders' YC page beneath as a
 *  second way in; with no person, the YC page; with neither, the company's website. */
export function contactWays(card: CompanyCard): { person: boolean; founders: string | null; website: string | null } {
  return {
    person: card.person !== null,
    founders: card.foundersUrl,
    website: card.person === null && card.foundersUrl === null ? card.website : null,
  };
}
