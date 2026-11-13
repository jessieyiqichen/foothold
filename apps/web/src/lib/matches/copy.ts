import { FAMILIES, LEVELS, type Family, type Level } from "../profile/roles";
import { MATCHES_PAGE_SIZE, MAX_PLACES_SHOWN } from "./constants";

const count = (n: number) => n.toLocaleString("en-US");

/** What the matches page says. House style: no full stops, errors without "!" and each with what to do next
 *  (copy.test.ts). */
export const MATCHES_COPY = {
  title: "Your matches",
  intro: "Roles at startups that fit your resume, each with the reason it is here",
  loading: "Finding your matches…",
  tryAgain: "Try again",
  loadFailed: "Your matches didn't load, check your connection and try again",

  noResume: "Add your resume first, your matches are found from it",
  toProfile: "Add your resume",
  noFamilies: "These are ranked on skills alone, pick the kind of work you want to put it first",
  pickFamilies: "Pick the kind of work",
  empty: "No roles match your profile yet, add skills or pick another kind of work on your profile",
  emptyAtLevels: "No roles match at these levels, turn a level off to see more",
  editProfile: "Edit your profile",

  levelsLegend: "Level",
  levelsNote: "Nothing picked shows every level · The level is read from the job title, and \"Level not in the title\" means the title doesn't say, not that the role is open to anyone",
  savingLevels: "Updating…",
  why: "Why this is here",
  noShared: "It is the kind of work you picked",
  newTab: "(opens in a new tab)",
  showingMore: "Loading more…",
  moreFailed: "More matches didn't load, check your connection and try again",
};

/** The lines that report a problem, for the style check. */
export const MATCHES_ERRORS = [MATCHES_COPY.loadFailed, MATCHES_COPY.moreFailed];

/** "Showing 50 of 1,234 matches", or just the count when all of them are on the page. */
export function countLine(shown: number, total: number): string {
  if (total === 0) return "No matches";
  if (shown < total) return `Showing ${count(shown)} of ${count(total)} matches`;
  return total === 1 ? "1 match" : `${count(total)} matches`;
}

/** The places a role is open in: a few by name, then how many more. */
export function placesLine(locations: readonly string[]): string {
  const shown = locations.slice(0, MAX_PLACES_SHOWN).join(", ");
  const more = locations.length - MAX_PLACES_SHOWN;
  return more > 0 ? `${shown} +${more} more` : shown;
}

/** "Posted Nov 3, 2026", in the reader's own time zone unless one is given; nothing when the date is unknown. */
export function postedLine(postedAt: string | null, timeZone?: string): string {
  if (!postedAt) return "";
  return `Posted ${new Date(postedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeZone })}`;
}

export const familyLabel = (id: Family): string => FAMILIES.find((family) => family.id === id)?.label ?? id;
export const levelLabel = (id: Level): string => LEVELS.find((level) => level.id === id)?.label ?? id;

/** The skills a person and a role share, by name: the reason the role is listed. */
export const whyLine = (shared: readonly string[]): string => (shared.length > 0 ? shared.join(" · ") : MATCHES_COPY.noShared);

/** "Show 50 more", or fewer when fewer are left. */
export const showMoreLabel = (total: number, asked: number): string => `Show ${count(Math.min(MATCHES_PAGE_SIZE, Math.max(total - asked, 0)))} more`;
