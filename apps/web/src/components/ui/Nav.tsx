"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentLink, NAV_LINKS, PUBLIC_NAV_LINKS, type NavLink } from "@/lib/nav";

/** The links themselves, as keys (Tape & Tile); `pathname` is null while it isn't known yet (prerender fallback). The
 *  page you are on is the key pressed in, in mustard, and `aria-current`: never colour alone. On a phone the four keys
 *  take a row of their own under the wordmark, each an equal share of the width (four did not fit beside it at 375px).
 *  A signed-out visitor sees Jobs and Companies only. */
export function NavLinks({ pathname, links = NAV_LINKS }: { pathname: string | null; links?: NavLink[] }) {
  return (
    <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="flex gap-1.5 sm:gap-2">
        {links.map((link) => {
          const current = isCurrentLink(link, pathname);
          return (
            <li key={link.href} className="flex-1 sm:flex-none">
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={
                  "keycap inline-flex min-h-10 w-full items-center justify-center border-2 border-line px-2 text-sm font-bold sm:w-auto sm:px-3 text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus " +
                  (current ? "bg-primary" : "bg-surface hover:bg-wash")
                }
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Nav() {
  const { isLoaded, isSignedIn } = useAuth();
  return <NavLinks pathname={usePathname()} links={isLoaded && !isSignedIn ? PUBLIC_NAV_LINKS : NAV_LINKS} />;
}
