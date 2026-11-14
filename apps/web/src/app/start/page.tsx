import type { Metadata } from "next";
import { StartScreen } from "@/components/start/StartScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Get started · Foothold" };

/** The first visit. Signed-in only: `src/proxy.ts` sends a signed-out visitor to sign in before any page not listed
 *  as public; sign-up lands here (the root layout's ClerkProvider). */
export default function StartPage() {
  return (
    <AppShell>
      <StartScreen />
    </AppShell>
  );
}
