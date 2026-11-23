import type { Metadata } from "next";
import { LandingRoute } from "@/components/matches/LandingRoute";
import { landingMetadata } from "@/lib/roles/landing";

export const metadata: Metadata = landingMetadata("remote");

/** Remote roles: the Jobs list with the place locked to remote (user, 2026-11-22). Open to signed-out visitors. */
export default function RemotePage() {
  return <LandingRoute id="remote" />;
}
