import type { Family, Level } from "../profile/roles";

/** One role matched to the signed-in person, as the page shows it. */
export interface Match {
  id: string;
  title: string;
  companyName: string | null;
  /** The posting on the company's own job board; always https. */
  url: string;
  /** Every place the same role is open in. */
  locations: string[];
  postedAt: string | null;
  family: Family;
  /** Read from the title; "unspecified" means the title does not say. */
  level: Level;
  /** The skills the person and the posting share: the reason the role is listed. */
  shared: string[];
  score: number;
}

/** One answer from the database, or several put together by "Show more". */
export interface MatchesPage {
  matches: Match[];
  /** How many matches there are in all, shown or not. */
  total: number;
  /** Rows left out because they could not be read or their link was not https. */
  dropped: number;
}
