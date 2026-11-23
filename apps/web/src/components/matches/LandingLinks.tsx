import Link from "next/link";
import { LANDING_COPY, LANDING_PAGES } from "@/lib/roles/landing";

/** At the top of the Jobs list: three quick links to the internship, new-grad and remote pages (user, 2026-11-22).
 *  Links, not filters: thin edges like the quick picks in Location, with an arrow, so they never pass for the page's
 *  one primary key. */
export function LandingLinks() {
  return (
    <nav aria-labelledby="landing-links" className="flex flex-wrap items-center gap-2">
      <span id="landing-links" className="font-mono text-xs text-muted">{LANDING_COPY.browse}</span>
      <ul className="flex flex-wrap gap-2">
        {LANDING_PAGES.map((page) => (
          <li key={page.id}>
            <Link href={page.path}
              className="inline-flex min-h-9 items-center gap-1 border border-ink bg-surface px-2 text-sm text-ink hover:bg-wash focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
              {page.chip}
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
