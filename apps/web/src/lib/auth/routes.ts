/** Where Clerk's own pages live; also passed to ClerkProvider and the proxy, so a redirect never leaves for Clerk's hosted pages. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

/** The only pages a signed-out visitor may open (user, 2026-10-25: every other page shows a person's goals). Clerk adds
 *  steps under each one (/sign-in/factor-one, /sign-up/verify-email-address), so those count too. */
const PUBLIC_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Where a person lands after signing in, and where "/" goes. The profile for now: it is the only Foothold page so
 *  far. What the front door should be is the user's decision and is still open (log.md, 2026-11-11). */
export const HOME_PATH = "/profile";
