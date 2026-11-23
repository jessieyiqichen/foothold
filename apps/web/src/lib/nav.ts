import { SAVED_PATH, TODAY_PATH } from "./cards/constants";
import { COMPANIES_PATH } from "./company/constants";
import { MATCHES_PATH } from "./matches/constants";
import { PROFILE_PATH } from "./profile/constants";
import { LANDING_PATHS } from "./roles/constants";

/** The name in the header and on the sign-in card. */
export const WORDMARK = "Foothold";

export interface NavLink {
  href: string;
  label: string;
}

/** Today's five first (the front door), then Jobs and Companies (open to everyone since 2026-11-21, the user's
 *  fastaijobs-style lists), then what was saved, then the profile. */
export const NAV_LINKS: NavLink[] = [
  { href: TODAY_PATH, label: "Today" },
  { href: MATCHES_PATH, label: "Jobs" },
  { href: COMPANIES_PATH, label: "Companies" },
  { href: SAVED_PATH, label: "Saved" },
  { href: PROFILE_PATH, label: "Profile" },
];

/** What a signed-out visitor can open; Sign in sits beside them in the header. */
export const PUBLIC_NAV_LINKS: NavLink[] = [
  { href: MATCHES_PATH, label: "Jobs" },
  { href: COMPANIES_PATH, label: "Companies" },
];

/** Whether a link is the page being shown; `pathname` is null while it isn't known yet (prerender fallback). */
export function isCurrentLink({ href }: NavLink, pathname: string | null): boolean {
  if (pathname === null) return false;
  // The internship, new-grad and remote pages are part of Jobs (2026-11-22)
  if (href === MATCHES_PATH && LANDING_PATHS.includes(pathname)) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
