"use client";

import { updateSettings } from "./actions";
import { addDays, toISODate } from "./dates";
import { downloadText } from "./download";
import { buildIcs, CALENDAR_DAYS } from "./ics";

/** Downloads the calendar file for the next days. Returns the last day it covers. */
export function addToCalendar(times: string[]): string {
  const start = toISODate(new Date());
  const ics = buildIcs({ times, startDate: start, days: CALENDAR_DAYS, appUrl: window.location.origin, stamp: new Date() });
  const until = addDays(start, CALENDAR_DAYS - 1);
  updateSettings({ nudgesSetUp: true, calendarUntil: until });
  downloadText(ics, "nudge-reminders.ics", "text/calendar");
  return until;
}

export type Permission = NotificationPermission | "unsupported";

export function notificationPermission(): Permission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

/** Asks the browser for permission and turns nudges on if granted. */
export async function turnOnNotifications(): Promise<Permission> {
  if (typeof Notification === "undefined") return "unsupported";
  try {
    const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (result === "granted") updateSettings({ notificationsOn: true, nudgesSetUp: true });
    return result;
  } catch (error) {
    console.error("Nudge: notification permission request failed", error);
    return notificationPermission();
  }
}
