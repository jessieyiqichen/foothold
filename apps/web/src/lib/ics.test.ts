import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

const ics = buildIcs({
  times: ["10:00", "20:00"],
  startDate: "2026-10-18",
  days: 2,
  appUrl: "https://nudge.example",
  stamp: new Date("2026-10-17T12:00:00Z"),
});

describe("buildIcs", () => {
  it("is a calendar with one event per day per time", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
  });

  it("uses local times and an alarm at the start of each event", () => {
    expect(ics).toContain("DTSTART:20261018T100000");
    expect(ics).toContain("DTSTART:20261019T200000");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(4);
    expect(ics).toContain("TRIGGER:PT0M");
  });

  it("links back to the app and is honest that it can't tell if you're done", () => {
    expect(ics).toContain("URL:https://nudge.example/?from=nudge");
    expect(ics).toContain("Already done today? Ignore this one");
  });

  it("uses CRLF line endings and keeps lines short", () => {
    const lines = ics.split("\r\n");
    lines.forEach((line) => expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75));
    expect(ics.includes("\n") && !ics.replace(/\r\n/g, "").includes("\n")).toBe(true);
  });
});
