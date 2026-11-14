// The first visit's mark in the browser's storage (steps.ts says why there is one). Storage can be missing or refuse
// (a private window, blocked site data); then there is no mark, and the rules fall back to the saved profile alone.
import { MARK_KEY_PREFIX } from "./constants";
import { readMark, type Mark } from "./steps";

const keyOf = (userId: string) => `${MARK_KEY_PREFIX}${userId}`;

export function loadMark(userId: string): Mark | null {
  try {
    return readMark(window.localStorage.getItem(keyOf(userId)));
  } catch {
    return null;
  }
}

export function storeMark(userId: string, mark: Mark): void {
  try {
    window.localStorage.setItem(keyOf(userId), JSON.stringify(mark));
  } catch (cause) {
    // Not fatal: without the mark, coming back starts from what the profile shows
    console.error("Foothold: could not keep the first visit's place in this browser", cause);
  }
}
