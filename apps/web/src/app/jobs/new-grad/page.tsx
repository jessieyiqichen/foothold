import type { Metadata } from "next";
import { LandingRoute } from "@/components/matches/LandingRoute";
import { landingMetadata } from "@/lib/roles/landing";

export const metadata: Metadata = landingMetadata("new-grad");

/** New grad roles: the Jobs list with the level locked to entry (user, 2026-11-22). Open to signed-out visitors. */
export default function NewGradPage() {
  return <LandingRoute id="new-grad" />;
}
