/** Names and limits for All roles (`/matches`) and its filters (user, 2026-11-16). The database side is data-scout's
 *  fh_roles and fh_roles_facets. */
export const ROLES_RPC = "fh_roles";
export const FACETS_RPC = "fh_roles_facets";
export const ROLES_PAGE_SIZE = 50;
/** The age choices, in days; null is Any time. 60 is the freshness rule's default (docs/architecture.md). */
export const DAY_CHOICES = [7, 30, 60, null] as const;
export type DayChoice = (typeof DAY_CHOICES)[number];
export const DEFAULT_DAYS: DayChoice = 60;
export const SORTS = ["fit", "newest"] as const;
export type Sort = (typeof SORTS)[number];
/** The one place the database matches specially, not as text. */
export const REMOTE_PLACE = "remote";
export const PLACE_PICKS = ["Remote", "San Francisco", "New York"] as const;
/** Longest search and place kept from the URL or the field. */
export const MAX_TEXT = 100;
/** How long typing waits before the search runs. */
export const SEARCH_DEBOUNCE_MS = 300;
