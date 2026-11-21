import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RESUME_CAP, TAKE_RUN_RPC } from "./constants";
import { DRAFT_COPY } from "./copy";
import { handleDraftRequest, isJson, parseCompanyId, type HandleDeps } from "./handle";
import type { DraftResult, Generate } from "./types";

const USER = "user_2abc";
const RESUME = "Built dashboards in SQL for a campus society. ".repeat(10);
const DRAFT = { subject: "Product intern at Acme", body: "Hi Dana, ...", resumeQuote: "Built dashboards in SQL", companyQuote: "Agents for hospital billing", model: "gemini-2.5-flash" };

interface World {
  profile?: unknown;
  company?: unknown;
  fit?: unknown;
  person?: unknown;
  /** The fh_postings row a chosen role_id reads. */
  posting?: unknown;
  /** What fh_take_draft_run answers: true while today's tries are not used up. */
  allowed?: unknown;
  fail?: string;
}

/** A stand-in for the Supabase client: answers from `world`, records every call, and fails the one step named in
 *  `world.fail` (a table or a function), so no request leaves the test. It has no insert or upsert at all: the route
 *  writes only through fh_take_draft_run. */
function fakeDb(world: World) {
  const calls: unknown[] = [];
  const answer = (what: string, data: unknown) =>
    Promise.resolve(world.fail === what ? { data: null, error: { message: `${what} refused` } } : { data, error: null });
  const RPC: Record<string, () => unknown> = {
    fh_company_fit: () => world.fit ?? [],
    fh_company_person: () => world.person ?? null,
    [TAKE_RUN_RPC]: () => ("allowed" in world ? world.allowed : true),
  };
  const db = {
    rpc: (name: string, args: unknown) => {
      calls.push([name, args]);
      return answer(name, RPC[name]());
    },
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: unknown) => ({
          maybeSingle: () => {
            calls.push([table, columns, column, value]);
            return answer(table, table === "fh_profiles" ? world.profile ?? null : table === "fh_postings" ? world.posting ?? null : world.company ?? null);
          },
        }),
      }),
    }),
  };
  return { db: db as unknown as HandleDeps["db"], calls };
}

const ready: World = {
  profile: { resume_text: RESUME },
  company: { name: "Acme AI", one_liner: "Agents for hospital billing", description: "Acme builds agents for hospital billing teams." },
  fit: [{ company_id: 812, roles: [{ title: "Associate Product Manager" }, { title: null }] }],
  person: { name: "Dana Lee", role: "Founder", contact: "dana@acme.ai" },
};

function run(world: World, over: Partial<Omit<HandleDeps, "db" | "userId">> & { signedIn?: boolean } = {}) {
  const { db, calls } = fakeDb(world);
  const generate = vi.fn<Generate>(async () => ({ ok: true, draft: DRAFT }));
  const deps: HandleDeps = { db, userId: USER, contentType: "application/json", body: { company_id: 812, consent: true }, apiKey: "test-key", generate, ...over };
  return { promise: handleDraftRequest(over.signedIn === false ? null : deps, deps), calls, generate: (over.generate ?? generate) as typeof generate };
}

const tookRun = (calls: unknown[]) => calls.filter((call) => Array.isArray(call) && call[0] === TAKE_RUN_RPC);

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

describe("parseCompanyId", () => {
  it("takes a positive whole company id, as a number or digits", () => {
    expect(parseCompanyId({ company_id: 812 })).toBe(812);
    expect(parseCompanyId({ company_id: "812" })).toBe(812);
  });

  it("refuses anything else", () => {
    for (const body of [null, "812", [], {}, { company_id: 0 }, { company_id: -3 }, { company_id: 1.5 }, { company_id: "8a" }, { company_id: Number.MAX_SAFE_INTEGER + 2 }, { id: 812 }]) {
      expect(parseCompanyId(body), JSON.stringify(body)).toBeNull();
    }
  });
});

describe("isJson", () => {
  it("accepts JSON, with or without a charset", () => {
    expect(isJson("application/json")).toBe(true);
    expect(isJson("application/json; charset=utf-8")).toBe(true);
    expect(isJson("Application/JSON")).toBe(true);
  });

  it("refuses anything else", () => {
    for (const type of [null, "", "text/plain", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x", "application/jsonp"]) {
      expect(isJson(type), String(type)).toBe(false);
    }
  });
});

describe("handleDraftRequest: the normal path", () => {
  it("takes a try, writes from the resume, the company, its roles and its person, and returns the draft without saving it", async () => {
    const { promise, calls, generate } = run(ready);
    expect(await promise).toEqual({ status: 200, body: { draft: DRAFT } });
    expect(generate).toHaveBeenCalledWith(
      {
        resumeText: RESUME,
        company: { name: "Acme AI", oneLiner: "Agents for hospital billing", description: "Acme builds agents for hospital billing teams." },
        roles: [{ title: "Associate Product Manager" }],
        person: { name: "Dana Lee", role: "Founder" },
      },
      { apiKey: "test-key" },
    );
    expect(calls).toContainEqual(["fh_company_fit", { p_days: 60, p_companies: [812] }]);
    expect(calls).toContainEqual(["fh_company_person", { p_company: 812 }]);
    expect(tookRun(calls)).toEqual([[TAKE_RUN_RPC, { p_company: 812 }]]);
  });

  it("passes at most RESUME_CAP characters of the resume", async () => {
    const { promise, generate } = run({ ...ready, profile: { resume_text: "a".repeat(RESUME_CAP + 500) } });
    await promise;
    expect(generate.mock.calls[0][0].resumeText).toHaveLength(RESUME_CAP);
  });

  it("writes with no person and no roles when the company has none", async () => {
    const { promise, generate } = run({ ...ready, fit: [], person: null });
    expect((await promise).status).toBe(200);
    expect(generate.mock.calls[0][0]).toMatchObject({ roles: [], person: null });
  });
});

describe("handleDraftRequest: refusals before any model call", () => {
  it("needs a signed-in person", async () => {
    const { promise, generate } = run(ready, { signedIn: false });
    expect(await promise).toEqual({ status: 401, body: { error: DRAFT_COPY.signedOut } });
    expect(generate).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON with 415, before reading anything", async () => {
    const { promise, calls } = run(ready, { contentType: "text/plain" });
    expect(await promise).toEqual({ status: 415, body: { error: DRAFT_COPY.notJson } });
    expect(calls).toEqual([]);
  });

  it("needs the person's agreement in the body, before reading anything or taking a try", async () => {
    for (const body of [{ company_id: 812 }, { company_id: 812, consent: false }, { company_id: 812, consent: "true" }, { company_id: 812, consent: 1 }]) {
      const { promise, calls, generate } = run(ready, { body });
      expect(await promise, JSON.stringify(body)).toEqual({ status: 400, body: { error: DRAFT_COPY.noConsent } });
      expect(calls).toEqual([]);
      expect(generate).not.toHaveBeenCalled();
    }
  });

  it("needs a company id", async () => {
    const { promise, calls } = run(ready, { body: { company_id: "abc", consent: true } });
    expect(await promise).toEqual({ status: 400, body: { error: DRAFT_COPY.badCompany } });
    expect(calls).toEqual([]);
  });

  it("needs a resume, and takes no try without one", async () => {
    for (const profile of [null, { resume_text: "" }, { resume_text: 5 }]) {
      const { promise, calls } = run({ ...ready, profile });
      expect(await promise).toEqual({ status: 409, body: { error: DRAFT_COPY.noResume } });
      expect(tookRun(calls)).toEqual([]);
    }
  });

  it("needs the company to exist", async () => {
    const { promise, calls } = run({ ...ready, company: null });
    expect(await promise).toEqual({ status: 404, body: { error: DRAFT_COPY.badCompany } });
    expect(tookRun(calls)).toEqual([]);
  });

  it("stops when the database says today's tries are used up", async () => {
    for (const allowed of [false, null, "yes"]) {
      const { promise, generate } = run({ ...ready, allowed });
      expect(await promise).toEqual({ status: 429, body: { error: DRAFT_COPY.limit } });
      expect(generate).not.toHaveBeenCalled();
    }
  });

  it("is switched off without a key, says so, and logs it", async () => {
    for (const apiKey of [undefined, ""]) {
      const { promise, calls } = run(ready, { apiKey });
      expect(await promise).toEqual({ status: 503, body: { error: DRAFT_COPY.noKey } });
      expect(calls).toEqual([]);
    }
    expect(logged).toHaveBeenCalled();
  });

  it.each(["fh_profiles", "fh_companies", "fh_company_fit", "fh_company_person", TAKE_RUN_RPC])(
    "gives a line, never the raw error, when %s fails",
    async (step) => {
      const { promise, generate } = run({ ...ready, fail: step });
      const answer = await promise;
      expect(answer).toEqual({ status: 502, body: { error: DRAFT_COPY.readFailed } });
      expect(JSON.stringify(answer)).not.toContain("refused");
      expect(generate).not.toHaveBeenCalled();
      expect(logged).toHaveBeenCalled();
    },
  );
});

describe("handleDraftRequest: the model's answers", () => {
  it.each([
    ["rate_limited", 429, DRAFT_COPY.busy],
    ["unavailable", 503, DRAFT_COPY.unavailable],
    ["unverified", 422, DRAFT_COPY.unverified],
    ["bad_input", 422, DRAFT_COPY.badInput],
  ] as const)("%s becomes %i with its own line", async (reason, status, line) => {
    const generate = vi.fn(async (): Promise<DraftResult> => ({ ok: false, reason }));
    expect(await run(ready, { generate }).promise).toEqual({ status, body: { error: line } });
  });

  it("treats a throw from the model call as unavailable", async () => {
    const generate = vi.fn(async (): Promise<DraftResult> => { throw new Error("socket hang up"); });
    expect(await run(ready, { generate }).promise).toEqual({ status: 503, body: { error: DRAFT_COPY.unavailable } });
    expect(logged).toHaveBeenCalled();
  });
});

// The company page lets the person pick the role a draft is about (user, 2026-11-21). The role must be an open role
// at that company; only its title goes to the model
describe("handleDraftRequest: a chosen role", () => {
  const withRole = (role_id: unknown, posting: unknown) =>
    run({ ...ready, posting }, { body: { company_id: 812, consent: true, role_id } });

  it("writes about the chosen role only", async () => {
    const { promise, calls, generate } = withRole(5501, { id: 5501, company_id: 812, title: "Data Analyst", closed_at: null });
    expect((await promise).status).toBe(200);
    expect(generate.mock.calls[0][0].roles).toEqual([{ title: "Data Analyst" }]);
    expect(calls).toContainEqual(["fh_postings", "id, company_id, title, closed_at", "id", 5501]);
  });
  it("takes the role id as digits too", async () => {
    const { promise, generate } = withRole("5501", { id: 5501, company_id: 812, title: "Data Analyst", closed_at: null });
    expect((await promise).status).toBe(200);
    expect(generate.mock.calls[0][0].roles).toEqual([{ title: "Data Analyst" }]);
  });
  it("refuses a role at another company, a closed role, an unknown role and a role id that is not a number, before any try", async () => {
    for (const [roleId, posting] of [
      [5501, { id: 5501, company_id: 999, title: "Data Analyst", closed_at: null }],
      [5501, { id: 5501, company_id: 812, title: "Data Analyst", closed_at: "2026-11-20T00:00:00Z" }],
      [5501, null],
      ["abc", null],
      [-3, null],
      [0, null],
      [1.5, null],
      [5501, { id: 5501, company_id: 812, title: "  ", closed_at: null }],
      [5501, { id: 5501, company_id: 812, title: null, closed_at: null }],
    ] as const) {
      const { promise, calls, generate } = withRole(roleId, posting);
      expect(await promise).toEqual({ status: 400, body: { error: DRAFT_COPY.badRole } });
      expect(generate).not.toHaveBeenCalled();
      expect(tookRun(calls)).toEqual([]);
    }
  });
  it("writes as before when no role is chosen", async () => {
    const { promise, generate } = withRole(null, null);
    expect((await promise).status).toBe(200);
    expect(generate.mock.calls[0][0].roles).toEqual([{ title: "Associate Product Manager" }]);
  });
  it("answers a failed read of the role without taking a try", async () => {
    const { promise, calls, generate } = run({ ...ready, fail: "fh_postings" }, { body: { company_id: 812, consent: true, role_id: 5501 } });
    expect(await promise).toEqual({ status: 502, body: { error: DRAFT_COPY.readFailed } });
    expect(generate).not.toHaveBeenCalled();
    expect(tookRun(calls)).toEqual([]);
  });
});
