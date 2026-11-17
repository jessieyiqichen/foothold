import { describe, expect, it } from "vitest";
import { DRAFT_COPY } from "./copy";
import { draftView, INITIAL_VIEW, type DraftView } from "./draftView";

const FIRST = { subject: "Product intern at Acme", body: "Hi Dana,\n\nI read...", resumeQuote: "Built dashboards in SQL", companyQuote: "Agents for hospital billing", model: "m" };
const SECOND = { ...FIRST, subject: "Another try", body: "Hi again" };

const run = (...actions: Parameters<typeof draftView>[1][]): DraftView => actions.reduce(draftView, INITIAL_VIEW);

describe("draftView: one card's draft, as the person sees it", () => {
  it("starts loading, then shows the saved draft in the fields", () => {
    expect(INITIAL_VIEW).toMatchObject({ loaded: false, draft: null, shown: null });
    expect(run({ type: "loaded", draft: FIRST })).toMatchObject({ loaded: true, loadFailed: false, draft: FIRST, shown: { subject: FIRST.subject, body: FIRST.body } });
  });

  it("says when the saved draft couldn't load, rather than showing no draft", () => {
    expect(run({ type: "loadFailed" })).toMatchObject({ loaded: true, loadFailed: true, draft: null });
  });

  it("keeps the person's edits, the draft and the editor through Write again and a refusal", () => {
    const edited = { subject: "My own subject", body: "My own words" };
    const writing = run({ type: "loaded", draft: FIRST }, { type: "edit", shown: edited }, { type: "writeStart" });
    expect(writing).toMatchObject({ writing: true, draft: FIRST, shown: edited, error: null });
    const refused = draftView(writing, { type: "writeFailed", message: DRAFT_COPY.limit });
    expect(refused).toMatchObject({ writing: false, draft: FIRST, shown: edited, error: DRAFT_COPY.limit });
  });

  it("replaces the fields only when a new draft arrives", () => {
    const view = run({ type: "loaded", draft: FIRST }, { type: "edit", shown: { subject: "x", body: "y" } }, { type: "writeStart" }, { type: "written", draft: SECOND });
    expect(view).toMatchObject({ writing: false, draft: SECOND, shown: { subject: SECOND.subject, body: SECOND.body }, error: null });
  });

  it("clears a load failure once a new draft is written, and says when a new draft couldn't be saved", () => {
    const view = run({ type: "loadFailed" }, { type: "writeStart" }, { type: "written", draft: FIRST }, { type: "saved", ok: false });
    expect(view).toMatchObject({ loadFailed: false, draft: FIRST, unsaved: true });
    expect(draftView(view, { type: "saved", ok: true }).unsaved).toBe(false);
  });

  it("does not change the view it is given", () => {
    const before = run({ type: "loaded", draft: FIRST });
    draftView(before, { type: "writeStart" });
    expect(before.writing).toBe(false);
  });
});
