"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatShortDate } from "@/lib/dates";
import { CALENDAR_DAYS } from "@/lib/ics";
import { addToCalendar } from "@/lib/reminders";

/** "10:00, 15:00 and 20:00" */
function spoken(times: string[]): string {
  return times.length > 1
    ? `${times.slice(0, -1).join(", ")} and ${times[times.length - 1]}`
    : (times[0] ?? "");
}

export function CalendarCard({ times }: { times: string[] }) {
  const [until, setUntil] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="calendar-title"
      className="flex flex-col gap-3 border-t-2 border-wash-strong pt-6 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:border-t-0 lg:pt-0"
    >
      {/* The one main button on the page: the calendar reminds you even with Nudge closed (user, 2026-10-19: two green
          buttons did not say which to pick) */}
      <h2
        id="calendar-title"
        className="font-display text-xl font-semibold text-ink"
      >
        Add to your calendar
      </h2>
      <p className="font-bold text-muted">
        Rings at {spoken(times)}, even when Nudge is closed
      </p>
      <p className="text-sm font-bold text-muted">
        It covers the next {CALENDAR_DAYS} days and can&apos;t see what
        you&apos;ve done, so ignore it once you&apos;re finished
      </p>
      <Button
        onClick={() => setUntil(addToCalendar(times))}
        className="self-start"
      >
        Download calendar file
      </Button>
      {until && (
        <p role="status" className="text-sm font-bold text-ink">
          Open nudge-reminders.ics to add it, it covers {CALENDAR_DAYS} days
          until {formatShortDate(until)}, then grab a new one
        </p>
      )}
    </section>
  );
}
