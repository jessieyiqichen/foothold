"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentLink, NAV_LINKS } from "@/lib/nav";

/** The links themselves, as keys (Tape & Tile); `pathname` is null while it isn't known yet (prerender fallback). The
 *  page you are on is the key pressed in, in mustard, and `aria-current`: never colour alone. */
export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main">
      <ul className="flex gap-1.5 sm:gap-2">
        {NAV_LINKS.map((link) => {
          const current = isCurrentLink(link, pathname);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={
                  "keycap inline-flex min-h-10 items-center border-2 border-line px-2 text-sm font-bold sm:px-3 text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus " +
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
  return <NavLinks pathname={usePathname()} />;
}
