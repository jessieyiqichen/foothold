// Shapes shared by the Scout's parsers, store and worker. No Deno or Node imports, so vitest tests this code and the
// Edge Function runs it unchanged (the same rule as board-worker).

export type CompanySource = "yc" | "hn";
export type PostingSource = "hn" | "yc" | "ats";

/** One company as Foothold stores it, whichever list it came from. */
export interface Company {
  source: CompanySource;
  sourceId: string;
  name: string;
  slug: string | null;
  website: string | null;
  /** The website's host without "www.", used to merge the same company across sources. */
  domain: string | null;
  oneLiner: string | null;
  description: string | null;
  tags: string[];
  industries: string[];
  locations: string[];
  teamSize: number | null;
  batch: string | null;
  stage: string | null;
  status: string | null;
  isHiring: boolean;
  /** The page this row was read from (a YC company page). */
  sourceUrl: string | null;
}

/** One job posting: a "Who is hiring" comment is one posting even when it lists several roles. */
export interface Posting {
  source: PostingSource;
  sourceId: string;
  companyName: string;
  title: string | null;
  location: string | null;
  text: string;
  url: string;
  links: string[];
  emails: string[];
  author: string | null;
  threadId: string | null;
  postedAt: string | null;
}

export const LIMITS = {
  name: 200, title: 300, location: 300, oneLiner: 1000, description: 20_000, text: 20_000, url: 2000, tag: 60,
} as const;
