import { Suspense } from "react";
import { MatchesScreen } from "@/components/matches/MatchesScreen";
import { AppShell } from "@/components/ui/AppShell";
import { MATCHES_COPY } from "@/lib/matches/copy";
import type { LandingId } from "@/lib/roles/landing";

/** One landing page on Jobs (`/jobs/internships`, `/jobs/new-grad`, `/jobs/remote`): the Jobs screen with one filter
 *  locked. As on `/matches`, the filters live in the URL, so the screen sits in a Suspense boundary. */
export function LandingRoute({ id }: { id: LandingId }) {
  return (
    <AppShell>
      <Suspense fallback={<p className="font-mono text-xs text-muted">{MATCHES_COPY.loading}</p>}>
        <MatchesScreen landing={id} />
      </Suspense>
    </AppShell>
  );
}
