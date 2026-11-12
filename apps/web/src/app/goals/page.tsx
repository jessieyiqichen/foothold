import type { Metadata } from "next";
import { GoalsScreen } from "@/components/goals/GoalsScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Goals · Nudge" };

export default function GoalsPage() {
  return (
    <AppShell>
      <GoalsScreen />
    </AppShell>
  );
}
