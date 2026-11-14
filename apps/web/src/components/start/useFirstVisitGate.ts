"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ProfileState } from "@/components/profile/useProfile";
import { START_PATH } from "@/lib/start/constants";
import { loadMark } from "@/lib/start/mark";
import { resumeStep } from "@/lib/start/steps";

/** True once the profile has loaded and the first visit still has a question for this person (lib/start/steps.ts);
 *  they are then sent to `/start`. Read while rendering: the profile is only ever loaded in the browser, where the
 *  first visit's mark lives. Used by the front door (today's five) and all roles. */
export function useFirstVisitGate(state: ProfileState, userId: string | null): boolean {
  const router = useRouter();
  const pending = state.kind === "ready" && userId !== null && resumeStep(state.profile, loadMark(userId)) !== "done";
  useEffect(() => {
    if (pending) router.replace(START_PATH);
  }, [pending, router]);
  return pending;
}
