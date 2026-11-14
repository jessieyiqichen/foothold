import type { Metadata } from "next";
import { TodayScreen } from "@/components/cards/TodayScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Today · Foothold" };

/** The front door: today's five company cards. Signed-in only (`src/proxy.ts`); fh_today answers for the caller. */
export default function TodayPage() {
  return (
    <AppShell>
      <TodayScreen />
    </AppShell>
  );
}
