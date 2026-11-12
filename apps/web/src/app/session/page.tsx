import type { Metadata } from "next";
import { TodayScreen } from "@/components/today/TodayScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Session · Nudge" };

/** Working through today's number is its own page, so Back (the link or the browser's) returns to Titi's room and the
 *  session itself is kept for the day: Today then says "Keep going". With nothing in progress it sends you to Today. */
export default function SessionPage() {
  return (
    <AppShell width="wide">
      <TodayScreen view="session" />
    </AppShell>
  );
}
