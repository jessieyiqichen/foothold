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
