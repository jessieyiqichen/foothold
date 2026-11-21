import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PITCH_COPY } from "./copy";
import { handlePitchRequest, type PitchDb, type Suggest } from "./handle";

const fakeDb = (resume: unknown, allowed: unknown = true, fail?: "profile" | "run") => {
  const rpc = vi.fn(async () => (fail === "run" ? { data: null, error: { message: "no" } } : { data: allowed, error: null }));
  const maybeSingle = vi.fn(async () => (fail === "profile" ? { data: null, error: { message: "no" } } : { data: { resume_text: resume }, error: null }));
  const db = { rpc, from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) } as unknown as PitchDb;
  return { db, rpc };
};
const ok: Suggest = vi.fn(async () => ({ ok: true, pitch: "UChicago MA student, interned as a PM" }) as const);
const deps = (over: Partial<Parameters<typeof handlePitchRequest>[1]> = {}) => ({ contentType: "application/json", body: { consent: true }, apiKey: "k", suggest: ok, ...over });

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logged = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => logged.mockRestore());

describe("handlePitchRequest", () => {
  it("takes one of the day's tries, with no company, and returns the suggestion", async () => {
    const { db, rpc } = fakeDb("Built evals");
    expect(await handlePitchRequest({ db, userId: "u" }, deps())).toEqual({ status: 200, body: { pitch: "UChicago MA student, interned as a PM" } });
    expect(rpc).toHaveBeenCalledWith("fh_take_draft_run", { p_company: null });
  });
  it("refuses before any try: signed out, not JSON, no consent, no key, no resume", async () => {
    const { db, rpc } = fakeDb("Built evals");
    expect(await handlePitchRequest(null, deps())).toEqual({ status: 401, body: { error: PITCH_COPY.signedOut } });
    expect((await handlePitchRequest({ db, userId: "u" }, deps({ contentType: "text/plain" }))).status).toBe(415);
    expect((await handlePitchRequest({ db, userId: "u" }, deps({ body: {} }))).status).toBe(400);
    expect((await handlePitchRequest({ db, userId: "u" }, deps({ apiKey: undefined }))).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    const empty = fakeDb("  ");
    expect(await handlePitchRequest({ db: empty.db, userId: "u" }, deps())).toEqual({ status: 409, body: { error: PITCH_COPY.noResume } });
    expect(empty.rpc).not.toHaveBeenCalled();
  });
  it("says when the day's tries are used, and when a read fails", async () => {
    expect(await handlePitchRequest({ db: fakeDb("Built evals", false).db, userId: "u" }, deps())).toEqual({ status: 429, body: { error: PITCH_COPY.limit } });
    expect(await handlePitchRequest({ db: fakeDb("x", true, "profile").db, userId: "u" }, deps())).toEqual({ status: 502, body: { error: PITCH_COPY.readFailed } });
  });
  it("passes the model's refusals on as the page's lines", async () => {
    const no: Suggest = async () => ({ ok: false, reason: "unverified" });
    expect(await handlePitchRequest({ db: fakeDb("Built evals").db, userId: "u" }, deps({ suggest: no }))).toEqual({ status: 422, body: { error: PITCH_COPY.unverified } });
  });
});
