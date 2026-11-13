import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { HOME_PATH } from "@/lib/auth/routes";
import { WORDMARK } from "@/lib/nav";
import { Nav, NavLinks } from "./Nav";

/** One centred column on a phone (36rem). From 1024px every page shares one desktop frame (72rem), so the wordmark and
 *  the navigation never move between pages. The width names are kept for the pages that pass them. */
const FRAME = "max-w-xl lg:max-w-6xl lg:px-8";
const WIDTHS = { narrow: FRAME, medium: FRAME, wide: FRAME };

/** The signed-in shell: the wordmark on the left with the navigation beside it, the account button on the right,
 *  a hairline under them, then the page. Foothold's own minimal look (user, 2026-11-12), a stopgap until the redesign. */
export function AppShell({ children, width = "narrow" }: { children: ReactNode; width?: keyof typeof WIDTHS }) {
  return (
    <div className={`mx-auto flex min-h-full w-full flex-col px-4 pb-16 ${WIDTHS[width]}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:mt-2 focus:self-start focus:rounded-lg focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <header className="flex min-h-14 items-center gap-3 border-b border-hairline sm:gap-6">
        <Link href={HOME_PATH} className="inline-flex min-h-9 items-center rounded-lg text-base font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {WORDMARK}
        </Link>
        <Suspense fallback={<NavLinks pathname={null} />}>
          <Nav />
        </Suspense>
        {/* Clerk's own account button: the person's picture, with Manage account and Sign out behind it. The box
            keeps its place while Clerk loads, so the header never shifts */}
        <div className="ml-auto flex size-9 items-center justify-center">
          <UserButton />
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col pt-6 text-[15px] leading-6">
        {children}
      </main>
    </div>
  );
}
