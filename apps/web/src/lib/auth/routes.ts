/** Where Clerk's own pages live; also passed to ClerkProvider and the proxy, so a redirect never leaves for Clerk's hosted pages. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

/** The only pages a signed-out visitor may open (user, 2026-10-25: every other page shows a person's goals). Clerk adds
 *  steps under each one (/sign-in/factor-one, /sign-up/verify-email-address), so those count too. */
const PUBLIC_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Where a person lands after signing in, and where "/" goes: today's five company cards, Foothold's front door
 *  (2026-11-14). Anyone the first visit still has a question for is sent on to `/start` from there. The redirect itself
 *  is in `next.config.ts`, which cannot import this file; routes.test.ts checks the two agree. */
export const HOME_PATH = "/today";
