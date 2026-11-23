import type { Metadata } from "next";
import { LandingRoute } from "@/components/matches/LandingRoute";
import { landingMetadata } from "@/lib/roles/landing";

export const metadata: Metadata = landingMetadata("internships");

/** Internships: the Jobs list with the level locked to intern (user, 2026-11-22). Open to signed-out visitors. */
export default function InternshipsPage() {
  return <LandingRoute id="internships" />;
}
