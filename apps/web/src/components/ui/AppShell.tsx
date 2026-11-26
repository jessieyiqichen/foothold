import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { SIGN_IN_LABEL } from "@/lib/company/copy";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { HOME_PATH } from "@/lib/auth/routes";
import { WORDMARK } from "@/lib/nav";
import { Nav, NavLinks } from "./Nav";
import { Shape } from "./art/Shape";
import { Tape } from "./art/Tape";

/** One centred column on a phone (36rem). From 768px every page shares one desktop frame (72rem), so the wordmark and
 *  the navigation never move between pages, and a window between 768 and 1024px wide is not left as a narrow middle
 *  column (user, 2026-11-24). The width names are kept for the pages that pass them. */
const FRAME = "max-w-xl md:max-w-6xl md:px-6 lg:px-8";
const WIDTHS = { narrow: FRAME, medium: FRAME, wide: FRAME };

/** The shell, signed in or out (a signed-out visitor sees Jobs, Companies and Sign in): the wordmark on the left, taped on at a slight tilt with its shape (the one front-facing piece
 *  of the header), the navigation keys beside it, the account button on the right, an ink rule under them, then the
 *  page. Tape & Tile (user, 2026-11-13). */
export function AppShell({ children, width = "narrow" }: { children: ReactNode; width?: keyof typeof WIDTHS }) {
  return (
    <div className={`mx-auto flex min-h-full w-full flex-col px-4 pb-16 ${WIDTHS[width]}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:mt-2 focus:self-start focus:rounded-lg focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-ink py-2 sm:flex-nowrap sm:gap-6">
        <Link href={HOME_PATH} className="relative inline-flex min-h-10 shrink-0 -rotate-[1.2deg] items-center gap-2 border-2 border-ink bg-surface px-2 py-1 sm:pl-1 text-lg font-black tracking-[-0.03em] text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus">
          <Tape small className="-top-1.5 left-1/2 -translate-x-1/2 rotate-[4deg]" />
          {/* Left out on a phone, where the wordmark shares its row with the account button only */}
          <Shape shape="quarter" color="red" tile="mustard" size={26} className="hidden sm:block" />
          {WORDMARK}
        </Link>
        <Suspense fallback={<NavLinks pathname={null} />}>
          <Nav />
        </Suspense>
        {/* Clerk's own account button: the person's picture, with Manage account and Sign out behind it. The box
            keeps its place while Clerk loads, so the header never shifts. Show, not SignedIn/SignedOut: those throw in
            Clerk Core 3 (review, 2026-11-22) */}
        <div className="ml-auto flex min-w-9 items-center justify-center">
          <Show when="signed-in"><UserButton /></Show>
          <Show when="signed-out">
            {/* A signed-out visitor (Jobs and Companies are open): sign in in a dialog and stay on this page */}
            <SignInButton mode="modal" forceRedirectUrl={HOME_PATH} signUpForceRedirectUrl={HOME_PATH}>
              <button type="button" className="keycap inline-flex min-h-10 items-center border-2 border-line bg-ink px-3 text-sm font-bold text-surface focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus">
                {SIGN_IN_LABEL}
              </button>
            </SignInButton>
          </Show>
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col pt-7 text-[15px] leading-6">
        {children}
      </main>
    </div>
  );
}
