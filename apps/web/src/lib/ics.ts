import { addDays } from "./dates";
import { NUDGE_PATH } from "./notify";
import { calendarLine } from "./nudges";

export const CALENDAR_DAYS = 14;

interface IcsInput {
  times: string[];
  startDate: string;
  days: number;
  appUrl: string;
  stamp: Date;
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Folds a content line to 75 octets, as the iCalendar format requires (content here is ASCII). */
function fold(line: string): string {
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

const compact = (iso: string) => iso.replace(/-/g, "");

function event(date: string, time: string, appUrl: string, stamp: string): string[] {
  const hour = Number(time.slice(0, 2));
  const line = calendarLine(date, hour);
  const link = `${appUrl}${NUDGE_PATH}`;
  return [
    "BEGIN:VEVENT",
    `UID:${compact(date)}-${time.replace(":", "")}@nudge`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${compact(date)}T${time.replace(":", "")}00`,
    "DURATION:PT10M",
    `SUMMARY:${escapeText(`Nudge: ${line}`)}`,
    `DESCRIPTION:${escapeText(`Open Nudge for today's number: ${link}\nAlready done today? Ignore this one`)}`,
    `URL:${link}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0M",
    `DESCRIPTION:${escapeText(line)}`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

/** A calendar file with one short event and alarm per reminder time, for each of the next days. */
export function buildIcs({ times, startDate, days, appUrl, stamp }: IcsInput): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = Array.from({ length: days }, (_, i) => addDays(startDate, i)).flatMap((date) =>
    [...times].sort().flatMap((time) => event(date, time, appUrl, dtstamp)),
  );
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nudge//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
