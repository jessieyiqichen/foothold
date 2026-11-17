import { SAVED_PATH, TODAY_PATH } from "./cards/constants";
import { MATCHES_PATH } from "./matches/constants";
import { PROFILE_PATH } from "./profile/constants";

/** The name in the header and on the sign-in card. */
export const WORDMARK = "Foothold";

export interface NavLink {
  href: string;
  label: string;
}

/** Today's five first (the front door), then what was saved, then every role that fits, then the profile. All roles
 *  joined the header on 2026-11-16 at the user's request: people expect to browse every role, and Today stays the
 *  front door. */
export const NAV_LINKS: NavLink[] = [
  { href: TODAY_PATH, label: "Today" },
  { href: SAVED_PATH, label: "Saved" },
  { href: MATCHES_PATH, label: "Roles" },
  { href: PROFILE_PATH, label: "Profile" },
];

/** Whether a link is the page being shown; `pathname` is null while it isn't known yet (prerender fallback). */
export function isCurrentLink({ href }: NavLink, pathname: string | null): boolean {
  return pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
}
