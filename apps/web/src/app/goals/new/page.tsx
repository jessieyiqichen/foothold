import type { Metadata } from "next";
import { NewGoalScreen } from "@/components/goals/NewGoalScreen";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Add a goal · Nudge" };

export default function NewGoalPage() {
  return (
    <AppShell width="wide">
      <NewGoalScreen />
    </AppShell>
  );
}
