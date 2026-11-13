"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentLink, NAV_LINKS } from "@/lib/nav";

/** The links themselves; `pathname` is null while it isn't known yet (prerender fallback). The page you are on is
 *  marked with a backing and `aria-current`, never by colour alone. */
export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main">
      <ul className="flex gap-1">
        {NAV_LINKS.map((link) => {
          const current = isCurrentLink(link, pathname);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={
                  "inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                  (current ? "bg-wash text-ink" : "text-muted hover:bg-wash hover:text-ink")
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
