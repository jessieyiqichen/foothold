"use client";

import { SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";
import { PUBLIC_COPY } from "@/lib/public/copy";

/** The sign-in key for a signed-out visitor: Clerk's dialog, and back to this same page after (user, 2026-11-21). */
export function SignInKey({ label, variant = "primary" }: { label: string; variant?: "primary" | "secondary" }) {
  // Back to this page after signing in or up, not the app's usual landing page (review, 2026-11-22)
  const here = usePathname() ?? undefined;
  return (
    <SignInButton mode="modal" forceRedirectUrl={here} signUpForceRedirectUrl={here}>
      <button type="button" className={buttonClass({ variant })}>{label}</button>
    </SignInButton>
  );
}

/** Above the signed-out Jobs list: what it is, and what signing in adds. */
export function JobsBanner() {
  return (
    <div className="flex flex-col gap-3 border-2 border-ink bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-base font-black tracking-[-0.01em] text-ink">{PUBLIC_COPY.bannerTitle}</p>
        <p className="font-mono text-xs leading-5 text-muted">{PUBLIC_COPY.bannerLine}</p>
      </div>
      <SignInKey label={PUBLIC_COPY.bannerButton} />
    </div>
  );
}

/** On a company page, in place of what depends on the resume: what signing in adds, and the key. */
export function LockedPart() {
  return (
    <section aria-labelledby="locked-title" className="flex flex-col gap-3 border-2 border-dashed border-ink bg-wash p-4">
      <h2 id="locked-title" className="font-condensed text-2xl leading-none font-bold tracking-[0.01em] text-ink uppercase">{PUBLIC_COPY.lockedTitle}</h2>
      <ul className="flex flex-col gap-1.5">
        {PUBLIC_COPY.lockedLines.map((line) => (
          <li key={line} className="flex items-center gap-2 text-sm text-ink"><span aria-hidden="true">🔒</span>{line}</li>
        ))}
      </ul>
      <div><SignInKey label={PUBLIC_COPY.lockedButton} /></div>
    </section>
  );
}
