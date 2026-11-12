"use client";

import { useCallback } from "react";
import { ProgressScreen } from "@/components/progress/ProgressScreen";
import { Toast } from "@/components/ui/Toast";
import { stashNotice, useNotice } from "@/lib/store";
import { useDesktop } from "@/lib/useDesktop";
import { GoalsScreen } from "./GoalsScreen";

/** A goal's own page: on a phone its progress alone; on a desktop the goal list with this goal chosen beside it. A
 *  confirmation carried from Edit goal ("Saved changes") shows here in a toast. */
export function GoalView({ id, fromToday }: { id: string; fromToday: boolean }) {
  const desktop = useDesktop();
  const notice = useNotice();
  const close = useCallback(() => stashNotice(null), []);
  return (
    <>
      {desktop ? <GoalsScreen selected={id} fromToday={fromToday} /> : <ProgressScreen id={id} fromToday={fromToday} />}
      <Toast message={notice} onClose={close} />
    </>
  );
}
