import type { Metadata } from "next";
import { MatchesScreen } from "@/components/matches/MatchesScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Matches · Foothold" };

/** Signed-in only: `src/proxy.ts` sends a signed-out visitor to sign in before any page not listed as public, and
 *  `fh_matches` answers only for the caller's own profile whatever the page does. */
export default function MatchesPage() {
  return (
    <AppShell>
      <MatchesScreen />
    </AppShell>
  );
}
