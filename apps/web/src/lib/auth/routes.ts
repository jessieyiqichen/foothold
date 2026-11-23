import { COMPANIES_PATH, ROLES_PATH } from "../company/constants";
import { MATCHES_PATH } from "../matches/constants";
import { LANDING_PATHS } from "../roles/constants";

/** Where Clerk's own pages live; also passed to ClerkProvider and the proxy, so a redirect never leaves for Clerk's hosted pages. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

/** The pages a signed-out visitor may open: sign-in and sign-up (Clerk adds steps under each, /sign-in/factor-one, so
 *  those count too), and since 2026-11-21 Jobs, Companies, every company page and every role page (the user: open the
 *  lists, sign in for what depends on the resume). The database answers them only through the public functions
 *  (20261122100000_foothold_public_browse.sql). "/" is a page of its own that sends each visitor on (app/page.tsx). */
const PUBLIC_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH, MATCHES_PATH, COMPANIES_PATH, ROLES_PATH];

/** Where "/" sends a signed-out visitor: Jobs, real roles on the first screen (user, 2026-11-21). */
export const PUBLIC_HOME_PATH = MATCHES_PATH;

export function isPublicPath(pathname: string): boolean {
  // "/" exactly, so app/page.tsx can send a signed-out visitor to Jobs (review, 2026-11-22: the proxy sent them to sign in)
  // The three Jobs landing pages exactly (user, 2026-11-22): /jobs itself is Nudge's old page and stays closed
  if (pathname === "/" || LANDING_PATHS.includes(pathname)) return true;
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Where a person lands after signing in, and where "/" goes: today's five company cards, Foothold's front door
 *  (2026-11-14). Anyone the first visit still has a question for is sent on to `/start` from there. app/page.tsx sends
 *  "/" here, or to PUBLIC_HOME_PATH for a signed-out visitor; routes.test.ts checks it does. */
export const HOME_PATH = "/today";
