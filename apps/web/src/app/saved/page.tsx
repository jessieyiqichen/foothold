import type { Metadata } from "next";
import { SavedScreen } from "@/components/cards/SavedScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Saved · Foothold" };

/** The companies the person saved or reached out to. Signed-in only (`src/proxy.ts`); fh_saved answers for the caller. */
export default function SavedPage() {
  return (
    <AppShell>
      <SavedScreen />
    </AppShell>
  );
}
