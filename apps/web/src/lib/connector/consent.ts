// The person's agreement to send their resume's experience to Google Gemini before a draft (user, 2026-11-16). Kept
// in this browser, one key per person, so it is asked once; if storage is blocked it is asked every time. The server
// does not rely on it: POST /api/drafts refuses any request without `consent: true` (handle.ts).

export type ConsentStorage = Pick<Storage, "getItem" | "setItem">;

const PREFIX = "foothold.draftConsent.";
/** The version of what was agreed to. It changed on 2026-11-21, when the one line about you and the kept changes were
 *  added to what is sent (review): an earlier "yes" no longer counts, so everyone is asked again. */
const AGREED = "yes-2026-11-21";

export const consentKey = (userId: string): string => `${PREFIX}${userId}`;

/** The browser's storage, or null where it cannot be reached (a server render, some private windows). */
function browserStorage(): ConsentStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Whether this person has agreed in this browser. Any failure reads as not yet, so the person is asked. */
export function hasConsent(userId: string | null, storage: ConsentStorage | null = browserStorage()): boolean {
  if (!userId || !storage) return false;
  try {
    return storage.getItem(consentKey(userId)) === AGREED;
  } catch {
    return false;
  }
}

/** Keeps the agreement; false when it could not be kept, so the next draft asks again. */
export function rememberConsent(userId: string | null, storage: ConsentStorage | null = browserStorage()): boolean {
  if (!userId || !storage) return false;
  try {
    storage.setItem(consentKey(userId), AGREED);
    return true;
  } catch (cause) {
    console.error("Foothold drafts: could not keep the agreement in this browser, it will be asked again", cause);
    return false;
  }
}
