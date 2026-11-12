import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Profile · Foothold" };

/** Signed-in only: `src/proxy.ts` sends a signed-out visitor to sign in before any page not listed as public, and
 *  row-level security answers with the person's own row whatever the page does. */
export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileScreen />
    </AppShell>
  );
}
