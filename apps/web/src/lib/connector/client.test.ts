import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFTS_TABLE, DRAFT_PATH } from "./constants";
import { DRAFT_COPY } from "./copy";
import { draftText, isEdited, loadSavedDraft, requestDraft, rowToDraft, saveDraft, type DraftsDb } from "./client";

const DRAFT = { subject: "Product intern at Acme", body: "Hi Dana,\n\nI read...", resumeQuote: "Built dashboards in SQL", companyQuote: "Agents for hospital billing", model: "gemini-2.5-flash" };
const ROW = { subject: DRAFT.subject, body: DRAFT.body, resume_quote: DRAFT.resumeQuote, company_quote: DRAFT.companyQuote, model: DRAFT.model };

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

const answer = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("requestDraft: asking the server route for a draft", () => {
  it("posts the company id and reads the draft", async () => {
    const fetcher = answer(200, { draft: DRAFT });
    expect(await requestDraft(812, fetcher)).toEqual({ ok: true, value: DRAFT });
    expect(fetcher).toHaveBeenCalledWith(DRAFT_PATH, expect.objectContaining({ method: "POST", body: JSON.stringify({ company_id: 812, consent: true }) }));
  });

  it("posts the chosen role with it, when there is one", async () => {
    const fetcher = answer(200, { draft: DRAFT });
    await requestDraft(812, fetcher, 5501);
    expect(fetcher).toHaveBeenCalledWith(DRAFT_PATH, expect.objectContaining({ body: JSON.stringify({ company_id: 812, consent: true, role_id: 5501 }) }));
  });

  it("shows the route's own line when it refuses", async () => {
    expect(await requestDraft(812, answer(429, { error: "You've written 10 drafts today, you can write more tomorrow" }))).toEqual({
      ok: false, message: "You've written 10 drafts today, you can write more tomorrow",
    });
  });

  it("falls back to its own line for an answer it cannot read or a request that never arrives", async () => {
    expect(await requestDraft(812, answer(500, "<html>"))).toEqual({ ok: false, message: DRAFT_COPY.failed });
    expect(await requestDraft(812, answer(200, { draft: { subject: 3 } }))).toEqual({ ok: false, message: DRAFT_COPY.failed });
    expect(await requestDraft(812, vi.fn(async () => { throw new TypeError("Failed to fetch"); }))).toEqual({ ok: false, message: DRAFT_COPY.failed });
    expect(logged).toHaveBeenCalled();
  });
});

describe("rowToDraft and loadSavedDraft: a saved draft loads with the card", () => {
  it("reads a saved row", () => {
    expect(rowToDraft(ROW)).toEqual(DRAFT);
    expect(rowToDraft({ ...ROW, body: null })).toBeNull();
  });

  it("asks for the person's draft for one company", async () => {
    const calls: unknown[] = [];
    const db = { from: (table: string) => ({ select: (columns: string) => ({ eq: (column: string, value: unknown) => ({ maybeSingle: async () => { calls.push([table, columns, column, value]); return { data: ROW, error: null }; } }) }) }) };
    expect(await loadSavedDraft(db as unknown as DraftsDb, 812)).toEqual({ ok: true, value: DRAFT });
    expect(calls).toEqual([[DRAFTS_TABLE, "subject, body, resume_quote, company_quote, model", "company_id", 812]]);
  });

  it("is no draft when there is none", async () => {
    const db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) };
    expect(await loadSavedDraft(db as unknown as DraftsDb, 812)).toEqual({ ok: true, value: null });
  });

  it("says it couldn't load, logged, when the read fails, rather than calling it no draft", async () => {
    const db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: "relation does not exist" } }) }) }) }) };
    expect(await loadSavedDraft(db as unknown as DraftsDb, 812)).toEqual({ ok: false, message: DRAFT_COPY.loadFailed });
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("saveDraft: the browser keeps the draft with the person's own client", () => {
  it("writes one row per company, replacing the earlier draft", async () => {
    const calls: unknown[] = [];
    const db = { from: (table: string) => ({ upsert: async (row: unknown, options: unknown) => { calls.push([table, row, options]); return { error: null }; } }) };
    expect(await saveDraft(db as unknown as DraftsDb, 812, DRAFT)).toBe(true);
    expect(calls).toEqual([[DRAFTS_TABLE, { company_id: 812, ...ROW }, { onConflict: "user_id,company_id" }]]);
  });

  it("is false, logged, when the write fails, so the card can say the draft is not kept", async () => {
    const db = { from: () => ({ upsert: async () => ({ error: { message: "JWT expired" } }) }) };
    expect(await saveDraft(db as unknown as DraftsDb, 812, DRAFT)).toBe(false);
    const thrown = { from: () => ({ upsert: async () => { throw new TypeError("Failed to fetch"); } }) };
    expect(await saveDraft(thrown as unknown as DraftsDb, 812, DRAFT)).toBe(false);
    expect(logged).toHaveBeenCalledTimes(2);
  });
});

describe("isEdited", () => {
  it("is true once the subject or the message differs from the draft", () => {
    expect(isEdited(DRAFT, { subject: DRAFT.subject, body: DRAFT.body })).toBe(false);
    expect(isEdited(DRAFT, { subject: "Hello", body: DRAFT.body })).toBe(true);
    expect(isEdited(DRAFT, { subject: DRAFT.subject, body: `${DRAFT.body} ` })).toBe(true);
  });
});

describe("draftText: what Copy puts on the clipboard", () => {
  it("is the subject line and the body", () => {
    expect(draftText({ subject: "Hello", body: "Hi Dana" })).toBe("Subject: Hello\n\nHi Dana");
  });
});
