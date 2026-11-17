import type { Decision, PersonSource } from "./constants";
import { MAX_INVESTORS_SHOWN } from "./constants";
import { ageLine } from "./age";

/** What today's cards and the saved page say. Nudge's voice: short, warm; no full stops; errors without "!", each
 *  with what to do next (copy.test.ts). */
export const CARDS_COPY = {
  todayTitle: "Today's five",
  loading: "Finding today's companies…",
  loadFailed: "Today's companies didn't load, check your connection and try again",
  tryAgain: "Try again",

  why: "Why it fits you",
  noShared: "It is the kind of work you picked",
  doing: "How they're doing",
  littleKnown: "Not much known yet",
  roles: "Roles to apply to",
  noRoles: "No open roles listed right now",
  contact: "Who to contact",
  noContact: "No contact found yet",
  website: "Their website",
  founders: "The founders are listed on Y Combinator",
  foundersNote: "Foothold links to this page and does not collect contacts from it",
  untitledRole: "Role from a Hacker News hiring post",
  unnamedPerson: "The person who posted this role",
  newTab: "(opens in a new tab)",

  save: "Save",
  reachedOut: "I reached out",
  skip: "Skip",
  deciding: "Saving…",
  undo: "Undo",
  decideFailed: "That didn't save, check your connection and try again",
  undoFailed: "That couldn't be undone, check your connection and try again",

  emptyTitle: "That's everyone for today",
  emptyLine: "No more companies fit you today, see every role while new ones come in",
  allRoles: "All roles",

  doneOutreach: "companies saved or reached out to",
  doneLooked: "companies looked at",
  seeSaved: "See my saved",
  fiveMore: "Show five more",

  savedTitle: "Saved",
  savedIntro: "Companies you saved or reached out to, newest first",
  savedLoading: "Loading your saved companies…",
  savedFailed: "Your saved companies didn't load, check your connection and try again",
  savedEmptyTitle: "Nothing saved yet",
  savedEmptyLine: "Save a company from today's five and it'll wait here",
  toToday: "See today's five",
  markReached: "Mark reached out",
  remove: "Remove",
  removed: "Removed",
  changeFailed: "That didn't change, check your connection and try again",
  allRolesLine: "Looking for something else? See every role that fits you",
};

/** The lines that report a problem, for the style check. */
export const CARDS_ERRORS = [CARDS_COPY.loadFailed, CARDS_COPY.decideFailed, CARDS_COPY.undoFailed, CARDS_COPY.savedFailed, CARDS_COPY.changeFailed];

export const DECISION_LABEL: Record<Decision, string> = { saved: "Saved", reached_out: "Reached out", skipped: "Skipped" };

/** A role's title, or where it came from when the source gave none. */
export const roleTitle = ({ title }: { title: string | null }): string => title ?? CARDS_COPY.untitledRole;
/** A person's name, or what they did when the source gave none. */
export const personName = ({ name }: { name: string | null }): string => name ?? CARDS_COPY.unnamedPerson;

export const cardLine = ({ n, of }: { n: number; of: number }): string => `Card ${n} of ${of}`;

export function decidedLine(decision: Decision, company: string): string {
  if (decision === "reached_out") return `Marked ${company} as reached out`;
  return `${DECISION_LABEL[decision]} ${company}`;
}

const SOURCE_WORDS: Record<PersonSource, string> = {
  hn: "a Hacker News hiring post",
  sec: "an SEC Form D filing",
  yc: "the company's YC page",
  site: "the company's own website",
};

/** Where a person was found and the day it was seen: always shown with a contact (docs/architecture.md). */
export function sourceLine(source: PersonSource, seenAt: string, timeZone?: string): string {
  const day = new Date(seenAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone });
  return `from ${SOURCE_WORDS[source]}, seen ${day}`;
}

export function investorsLine(investors: readonly string[]): string {
  const shown = investors.slice(0, MAX_INVESTORS_SHOWN);
  const more = investors.length - shown.length;
  const named = more > 0 ? `${shown.join(", ")} +${more} more` : shown.length > 1 ? `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}` : shown[0];
  return `Backed by ${named}`;
}

interface Doing {
  stage: string | null;
  batch: string | null;
  teamSize: number | null;
  investors: string[];
  lastPostedAt: string | null;
  recentRoles: number | null;
}

/** How the company is doing, one fact a line, leaving out what is not known. */
export function doingLines({ stage, batch, teamSize, investors, lastPostedAt, recentRoles }: Doing, now: Date = new Date()): string[] {
  const age = ageLine(lastPostedAt, now);
  const posted = recentRoles && recentRoles > 0
    ? `${recentRoles} ${recentRoles === 1 ? "role" : "roles"} posted in the last 60 days${age ? `, the last ${age}` : ""}`
    : age ? `Last posted a role ${age}` : "";
  const lines = [
    [stage, batch ? `YC ${batch}` : null].filter(Boolean).join(" · "),
    teamSize ? `${teamSize} ${teamSize === 1 ? "person" : "people"}` : "",
    investors.length > 0 ? investorsLine(investors) : "",
    posted,
  ].filter(Boolean);
  return lines.length > 0 ? lines : [CARDS_COPY.littleKnown];
}
