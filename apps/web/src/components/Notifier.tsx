"use client";

import { useEffect } from "react";
import { toISODate } from "@/lib/dates";
import { NUDGE_PATH, planNotifications } from "@/lib/notify";
import { nudgeLine } from "@/lib/nudges";
import { sortByUrgency } from "@/lib/quota";
import { currentData, useStore } from "@/lib/store";

/** Shows a nudge at each reminder time while a tab is open, but only if nothing has been started today. */
function fire(hour: number) {
  const data = currentData();
  if (!data || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const today = toISODate(new Date());
  const waiting = sortByUrgency(data.goals, data.entries, today).find((g) => g.plan.status === "not-started");
  if (!waiting) return;
  const notification = new Notification("Nudge", { body: nudgeLine(waiting.goal, waiting.plan, today, hour), tag: "nudge" });
  // Opens Today as a nudge visit (a fresh load, so the visit is read as coming from the nudge), not just the tab as it
  // was (reviewer, user 2026-10-19: the reward should lead straight back to the task)
  notification.onclick = () => {
    window.focus();
    notification.close();
    window.location.assign(NUDGE_PATH);
  };
}

export function Notifier() {
  const state = useStore();
  const settings = state?.kind === "ready" ? state.data.settings : null;
  const on = settings?.notificationsOn ?? false;
  const times = settings?.reminderTimes.join(",") ?? "";

  useEffect(() => {
    if (!on || !times) return;
    const timers = planNotifications(new Date(), times.split(",")).map(({ at }) =>
      window.setTimeout(() => fire(at.getHours()), at.getTime() - Date.now()),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [on, times]);

  return null;
}
