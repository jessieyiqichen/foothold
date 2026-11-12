"use client";

import { useRouter } from "next/navigation";
import { GoalWizard } from "@/components/onboarding/GoalWizard";

/** The first visit: Titi walks you to your first goal and your first task, one tap per screen; the task is its own page. */
export function FirstVisit() {
  const router = useRouter();
  return <GoalWizard firstVisit onStarted={() => router.push("/session")} />;
}
