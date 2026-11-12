import type { Metadata } from "next";
import { RemindersScreen } from "@/components/reminders/RemindersScreen";
import { AppShell } from "@/components/ui/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Reminders · Nudge" };


export default function RemindersPage() {
  return (
    <AppShell>
      {/* No intro: each part says what it does in one line (reviewer, user 2026-10-19: the page repeated itself) */}
      <PageHeader title="Reminders" back="/goals" backLabel="← Goals" />
      <RemindersScreen />
    </AppShell>
  );
}
