import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchesScreen } from "@/components/matches/MatchesScreen";
import { AppShell } from "@/components/ui/AppShell";
import { MATCHES_COPY } from "@/lib/matches/copy";

export const metadata: Metadata = { title: "All roles · Foothold" };

/** Signed-in only: `src/proxy.ts` sends a signed-out visitor to sign in before any page not listed as public, and
 *  fh_roles answers only for the caller's own profile whatever the page does. The filters live in the URL, read with
 *  useSearchParams, so the screen sits in a Suspense boundary: the shell still renders ahead of it. */
export default function MatchesPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="font-mono text-xs text-muted">{MATCHES_COPY.loading}</p>}>
        <MatchesScreen />
      </Suspense>
    </AppShell>
  );
}
