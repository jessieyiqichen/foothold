import { ageLine } from "../cards/age";

/** What the Companies page says. Nudge's voice: no full stops; errors without "!", each says what to do next. */
export const COMPANIES_COPY = {
  title: "Companies",
  search: "Search companies",
  stage: "Stage",
  anyStage: "Any stage",
  backer: "Backed by",
  anyBacker: "Anyone",
  hiring: "Hiring now",
  sort: "Sort",
  recent: "Newest roles",
  roles: "Most roles",
  fit: "Best fit",
  loading: "Finding companies…",
  loadFailed: "Companies didn't load, check your connection and try again",
  tryAgain: "Try again",
  empty: "No company matches these filters, clear one to see more",
  more: "Show more",
  moreFailed: "More didn't load, check your connection and try again",
} as const;

export const COMPANIES_ERRORS = [COMPANIES_COPY.loadFailed, COMPANIES_COPY.moreFailed, COMPANIES_COPY.empty] as const;

export const companiesCount = (n: number): string => `${n.toLocaleString("en-US")} ${n === 1 ? "company" : "companies"}`;

/** "70 open roles", the row's lead number; "No open roles right now" when there are none. */
export const openRolesCount = (openRoles: number): string =>
  openRoles === 0 ? "No open roles right now" : `${openRoles} open ${openRoles === 1 ? "role" : "roles"}`;

/** "newest 2 days ago", the quiet line under the count; null with no date. */
export function newestLine(lastPostedAt: string | null, now: Date = new Date()): string | null {
  const age = ageLine(lastPostedAt, now);
  return age ? `newest ${age}` : null;
}

/** "10 open roles, newest 2 days ago"; "No open roles right now" when there are none. */
export function hiringLine(openRoles: number, lastPostedAt: string | null, now: Date = new Date()): string {
  if (openRoles === 0) return openRolesCount(0);
  const newest = newestLine(lastPostedAt, now);
  return `${openRolesCount(openRoles)}${newest ? `, ${newest}` : ""}`;
}
