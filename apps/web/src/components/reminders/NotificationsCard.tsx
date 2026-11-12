"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateSettings } from "@/lib/actions";
import { LAST_CALL, planNotifications } from "@/lib/notify";

type Permission = NotificationPermission | "unsupported";

function readPermission(): Permission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

function upcoming(times: string[]): string {
  const plan = planNotifications(new Date(), times);
  if (plan.length === 0) return "No more today, tomorrow I'll start again";
  const list = plan.map((p) => p.at.toTimeString().slice(0, 5)).join(", ");
  return `Still to come today if you haven't started: ${list}`;
}

export function NotificationsCard({ on, times }: { on: boolean; times: string[] }) {
  const [permission, setPermission] = useState<Permission>(readPermission);

  async function turnOn() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") updateSettings({ notificationsOn: true, nudgesSetUp: true });
    } catch (error) {
      console.error("Nudge: notification permission request failed", error);
      setPermission(readPermission());
    }
  }

  function sendTest() {
    new Notification("Nudge", { body: "This is what a nudge looks like, just one to start!", tag: "nudge-test" });
  }

  return (
    <section aria-labelledby="notify-title" className="flex flex-col gap-3 border-t-2 border-wash-strong pt-6 lg:col-span-7 lg:col-start-6 lg:row-start-2">
      <h2 id="notify-title" className="font-display text-xl font-semibold text-ink">Notifications</h2>
      <p className="font-bold text-muted">Only while a Nudge tab is open, and Titi stops once you&apos;ve started, with one last call at {LAST_CALL}</p>

      {permission === "unsupported" && <p className="text-sm font-bold text-muted">This browser doesn&apos;t do notifications, the calendar file still works</p>}

      {permission === "denied" && (
        <p className="text-sm font-bold text-ink">Blocked for this site: in your browser&apos;s site settings set Notifications to Allow, then reload</p>
      )}

      {permission === "default" && (
        <Button variant="secondary" onClick={turnOn} className="self-start">Turn on notifications</Button>
      )}

      {permission === "granted" && !on && (
        <Button variant="secondary" onClick={() => updateSettings({ notificationsOn: true, nudgesSetUp: true })} className="self-start">
          Turn on notifications
        </Button>
      )}

      {permission === "granted" && on && (
        <>
          <p role="status" className="font-bold text-ink">On! {upcoming(times)}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={sendTest}>Send a test nudge</Button>
            <Button variant="ghost" onClick={() => updateSettings({ notificationsOn: false })}>Turn off</Button>
          </div>
        </>
      )}
    </section>
  );
}
