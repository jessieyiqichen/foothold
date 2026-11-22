import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchesScreen } from "@/components/matches/MatchesScreen";
import { AppShell } from "@/components/ui/AppShell";
import { MATCHES_COPY } from "@/lib/matches/copy";

export const metadata: Metadata = { title: "Jobs · Foothold" };

/** Jobs, open to signed-out visitors since 2026-11-21: they read fh_public_roles (titles, places, dates, links), a
 *  signed-in person fh_roles, which answers only for their own profile. The filters live in the URL, read with
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
