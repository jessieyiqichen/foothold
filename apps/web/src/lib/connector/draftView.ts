// One card's draft as the person sees it, as a reducer the tests can run: what is saved, what the fields hold, and
// whether a new draft is being written. The fields change only when the person types or a new draft arrives, so a
// refused "Write again" (the limit, the model unreachable, a draft that failed its checks) leaves their edits as they
// were (reviewer, 2026-11-16).
import type { Draft } from "./types";

export type Shown = { subject: string; body: string };

export interface DraftView {
  /** The saved draft has been asked for. */
  loaded: boolean;
  /** Asking for it failed: the card says so instead of claiming there is none. */
  loadFailed: boolean;
  draft: Draft | null;
  /** What the subject and message fields hold. */
  shown: Shown | null;
  writing: boolean;
  /** The route's line for the last refused try. */
  error: string | null;
  /** A new draft arrived but could not be saved. */
  unsaved: boolean;
}

export type DraftAction =
  | { type: "loaded"; draft: Draft | null }
  | { type: "loadFailed" }
  | { type: "edit"; shown: Shown }
  | { type: "writeStart" }
  | { type: "writeFailed"; message: string }
  | { type: "written"; draft: Draft }
  | { type: "saved"; ok: boolean };

export const INITIAL_VIEW: DraftView = { loaded: false, loadFailed: false, draft: null, shown: null, writing: false, error: null, unsaved: false };

const fieldsOf = (draft: Draft | null): Shown | null => (draft ? { subject: draft.subject, body: draft.body } : null);

export function draftView(view: DraftView, action: DraftAction): DraftView {
  switch (action.type) {
    case "loaded":
      return { ...view, loaded: true, loadFailed: false, draft: action.draft, shown: fieldsOf(action.draft) };
    case "loadFailed":
      return { ...view, loaded: true, loadFailed: true };
    case "edit":
      return { ...view, shown: action.shown };
    case "writeStart":
      return { ...view, writing: true, error: null };
    case "writeFailed":
      return { ...view, writing: false, error: action.message };
    case "written":
      return { ...view, writing: false, error: null, loadFailed: false, unsaved: false, draft: action.draft, shown: fieldsOf(action.draft) };
    case "saved":
      return { ...view, unsaved: !action.ok };
  }
}

/** Whether "Write a draft" or "Write again" may be pressed: once the saved draft is known, while nothing is being
 *  written. Not after a failed load: a saved draft may exist that the page could not show, and writing would replace
 *  it unseen (reviewer, 2026-11-16). Reloading the page tries the load again. */
export const canWrite = (view: DraftView): boolean => view.loaded && !view.loadFailed && !view.writing;
