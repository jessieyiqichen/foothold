import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAILY_DRAFT_LIMIT, DRAFT_RUNS_TABLE, DRAFTS_TABLE, RESUME_CAP } from "./constants";
import { DRAFT_COPY } from "./copy";
import { handleDraftRequest, parseCompanyId, utcDayStart, type HandleDeps } from "./handle";
import type { DraftInput, DraftResult } from "./types";

const USER = "user_2abc";
const NOW = new Date("2026-11-16T15:00:00Z");
const RESUME = "Built dashboards in SQL for a campus society. ".repeat(10);
const DRAFT = { subject: "Product intern at Acme", body: "Hi Dana, ...", resumeQuote: "Built dashboards in SQL", companyQuote: "Agents for hospital billing", model: "gemini-2.5-flash" };

interface World {
  profile?: unknown;
  company?: unknown;
  fit?: unknown;
  person?: unknown;
  runs?: number;
  fail?: string;
}

/** A stand-in for the Supabase client: answers from `world`, records every write, and fails the one step named in
 *  `world.fail` (a table or a function), so no request leaves the test. */
function fakeDb(world: World) {
  const writes: unknown[] = [];
  const reads: unknown[] = [];
  const answer = (what: string, data: unknown, extra: Record<string, unknown> = {}) =>
    Promise.resolve(world.fail === what ? { data: null, error: { message: `${what} refused` }, count: null } : { data, error: null, ...extra });
  const db = {
    rpc: (name: string, args: unknown) => {
      reads.push([name, args]);
      return answer(name, name === "fh_company_fit" ? world.fit ?? [] : world.person ?? null);
    },
    from: (table: string) => ({
      select: (columns: string, options?: unknown) => ({
        eq: (column: string, value: unknown) => ({
          maybeSingle: () => {
            reads.push([table, columns, column, value]);
            return answer(table, table === "fh_profiles" ? world.profile ?? null : world.company ?? null);
          },
        }),
        gte: (column: string, value: string) => {
          reads.push([table, columns, options, column, value]);
          return answer(`${table}:count`, null, { count: world.runs ?? 0 });
        },
      }),
      insert: (row: unknown) => { writes.push([table, "insert", row]); return answer(`${table}:insert`, null); },
      upsert: (row: unknown, options: unknown) => { writes.push([table, "upsert", row, options]); return answer(`${table}:upsert`, null); },
    }),
  };
  return { db: db as unknown as HandleDeps["db"], writes, reads };
}

const ready: World = {
  profile: { resume_text: RESUME },
  company: { name: "Acme AI", one_liner: "Agents for hospital billing", description: "Acme builds agents for hospital billing teams." },
  fit: [{ company_id: 812, roles: [{ title: "Associate Product Manager" }, { title: null }] }],
  person: { name: "Dana Lee", role: "Founder", contact: "dana@acme.ai" },
};

function run(world: World, over: Partial<Omit<HandleDeps, "db" | "userId">> & { signedIn?: boolean } = {}) {
  const { db, writes, reads } = fakeDb(world);
  const generate = vi.fn(async (_input: DraftInput): Promise<DraftResult> => ({ ok: true, draft: DRAFT }));
  const deps: HandleDeps = { db, userId: USER, body: { company_id: 812 }, apiKey: "test-key", generate, now: NOW, ...over };
  return { promise: handleDraftRequest(over.signedIn === false ? null : deps, deps), writes, reads, generate: (over.generate ?? generate) as typeof generate };
}

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

describe("utcDayStart", () => {
  it("is midnight UTC of the given moment", () => {
    expect(utcDayStart(new Date("2026-11-16T23:59:00-06:00")).toISOString()).toBe("2026-11-17T00:00:00.000Z");
    expect(utcDayStart(NOW).toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
});

describe("handleDraftRequest: the normal path", () => {
  it("records a run, writes from the resume, the company, its roles and its person, saves the draft and returns it", async () => {
    const { promise, writes, reads, generate } = run(ready);
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
    expect(reads).toContainEqual(["fh_company_fit", { p_days: 60, p_companies: [812] }]);
    expect(reads).toContainEqual(["fh_company_person", { p_company: 812 }]);
    expect(reads).toContainEqual([DRAFT_RUNS_TABLE, "at", { count: "exact", head: true }, "at", "2026-11-16T00:00:00.000Z"]);
    expect(writes).toEqual([
      [DRAFT_RUNS_TABLE, "insert", { company_id: 812 }],
      [DRAFTS_TABLE, "upsert", { company_id: 812, subject: DRAFT.subject, body: DRAFT.body, resume_quote: DRAFT.resumeQuote, company_quote: DRAFT.companyQuote, model: DRAFT.model }, { onConflict: "user_id,company_id" }],
    ]);
  });

  it("passes at most 12,000 characters of the resume", async () => {
    const { promise, generate } = run({ ...ready, profile: { resume_text: "a".repeat(RESUME_CAP + 500) } });
    await promise;
    expect(RESUME_CAP).toBe(12_000);
    expect(generate.mock.calls[0][0].resumeText).toHaveLength(RESUME_CAP);
  });

  it("writes with no person and no roles when the company has none", async () => {
    const { promise, generate } = run({ ...ready, fit: [], person: null });
    expect((await promise).status).toBe(200);
    expect(generate.mock.calls[0][0]).toMatchObject({ roles: [], person: null });
  });

  it("still returns the draft when saving it fails, and logs why", async () => {
    const { promise } = run({ ...ready, fail: `${DRAFTS_TABLE}:upsert` });
    expect(await promise).toEqual({ status: 200, body: { draft: DRAFT } });
    expect(logged).toHaveBeenCalled();
  });
});

describe("handleDraftRequest: refusals before any model call", () => {
  it("needs a signed-in person", async () => {
    const { promise, generate } = run(ready, { signedIn: false });
    expect(await promise).toEqual({ status: 401, body: { error: DRAFT_COPY.signedOut } });
    expect(generate).not.toHaveBeenCalled();
  });

  it("needs a company id", async () => {
    const { promise, writes } = run(ready, { body: { company_id: "abc" } });
    expect(await promise).toEqual({ status: 400, body: { error: DRAFT_COPY.badCompany } });
    expect(writes).toEqual([]);
  });

  it("needs a resume", async () => {
    for (const profile of [null, { resume_text: "" }, { resume_text: 5 }]) {
      const { promise, writes } = run({ ...ready, profile });
      expect(await promise).toEqual({ status: 409, body: { error: DRAFT_COPY.noResume } });
      expect(writes).toEqual([]);
    }
  });

  it("needs the company to exist", async () => {
    const { promise } = run({ ...ready, company: null });
    expect(await promise).toEqual({ status: 404, body: { error: DRAFT_COPY.badCompany } });
  });

  it("stops at the daily limit, without recording a run", async () => {
    expect(DAILY_DRAFT_LIMIT).toBe(10);
    const { promise, writes, generate } = run({ ...ready, runs: 10 });
    expect(await promise).toEqual({ status: 429, body: { error: DRAFT_COPY.limit } });
    expect(writes).toEqual([]);
    expect(generate).not.toHaveBeenCalled();
  });

  it("allows the tenth draft of the day", async () => {
    expect((await run({ ...ready, runs: 9 }).promise).status).toBe(200);
  });

  it("is switched off without a key, says so, and logs it", async () => {
    for (const apiKey of [undefined, ""]) {
      const { promise, writes } = run(ready, { apiKey });
      expect(await promise).toEqual({ status: 503, body: { error: DRAFT_COPY.noKey } });
      expect(writes).toEqual([]);
    }
    expect(logged).toHaveBeenCalled();
  });

  it.each(["fh_profiles", "fh_companies", "fh_company_fit", "fh_company_person", `${DRAFT_RUNS_TABLE}:count`, `${DRAFT_RUNS_TABLE}:insert`])(
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
  ] as const)("%s becomes %i with its own line, and nothing is saved", async (reason, status, line) => {
    const generate = vi.fn(async (): Promise<DraftResult> => ({ ok: false, reason }));
    const { promise, writes } = run(ready, { generate });
    expect(await promise).toEqual({ status, body: { error: line } });
    expect(writes).toEqual([[DRAFT_RUNS_TABLE, "insert", { company_id: 812 }]]);
  });

  it("treats a throw from the model call as unavailable", async () => {
    const generate = vi.fn(async (): Promise<DraftResult> => { throw new Error("socket hang up"); });
    expect(await run(ready, { generate }).promise).toEqual({ status: 503, body: { error: DRAFT_COPY.unavailable } });
    expect(logged).toHaveBeenCalled();
  });
});
