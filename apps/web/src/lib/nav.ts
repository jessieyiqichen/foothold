import { MATCHES_PATH } from "./matches/constants";
import { PROFILE_PATH } from "./profile/constants";

/** The name in the header and on the sign-in card. */
export const WORDMARK = "Foothold";

export interface NavLink {
  href: string;
  label: string;
}

/** Foothold's two pages, the front door first. Today and Goals left the navigation on 2026-11-12 (the lead's call,
 *  logged as reversible); their pages and code stay. */
export const NAV_LINKS: NavLink[] = [
  { href: MATCHES_PATH, label: "Matches" },
  { href: PROFILE_PATH, label: "Profile" },
];

/** Whether a link is the page being shown; `pathname` is null while it isn't known yet (prerender fallback). */
export function isCurrentLink({ href }: NavLink, pathname: string | null): boolean {
  return pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
}
