import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_RESUME_CHARS, PROFILE_TABLE } from "./constants";
import { PROFILE_COPY } from "./copy";
import { deleteProfile, loadProfile, rowToProfile, saveProfile, type Db } from "./store";
import { SKILLS_VERSION } from "./vocabulary";

const USER = "user_2abc";
const RESUME = "Econometrics coursework; regression models in Stata and R; SQL and Python dashboards. ".repeat(4);
const savedRow = {
  resume_text: RESUME.trim(), resume_name: "resume.pdf", tags: ["python", "sql"], tags_version: SKILLS_VERSION,
  updated_at: "2026-11-11T18:00:00.000Z",
};

type Answer = { data: unknown; error: { message: string } | null };
type Mode = "ok" | "refused" | "offline";

/** A stand-in for the Supabase client: records every call and answers from `row`, so no request leaves the test.
 *  "refused" is the database saying no (row-level security, a check); "offline" is the request never arriving. */
function fakeDb(row: unknown, mode: Mode = "ok") {
  const calls: string[] = [];
  const written: Record<string, unknown>[] = [];
  const answer = async (data: unknown): Promise<Answer> => {
    if (mode === "offline") throw new TypeError("Failed to fetch");
    return mode === "refused" ? { data: null, error: { message: "new row violates row-level security policy" } } : { data, error: null };
  };
  const db = {
    from(table: string) {
      return {
        select: (columns: string) => ({
          eq: (column: string, value: string) => ({
            maybeSingle: () => { calls.push(`select ${table} (${columns}) where ${column}=${value}`); return answer(row); },
          }),
        }),
        upsert: (values: Record<string, unknown>, options: { onConflict: string }) => ({
          select: () => ({
            single: () => {
              calls.push(`upsert ${table} on ${options.onConflict}`);
              written.push(values);
              return answer({ ...values, updated_at: "2026-11-11T18:00:00.000Z" });
            },
          }),
        }),
        delete: () => ({
          eq: (column: string, value: string) => { calls.push(`delete ${table} where ${column}=${value}`); return answer(null); },
        }),
      };
    },
  };
  return { db: db as unknown as Db, calls, written };
}

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

describe("rowToProfile: a row is checked before it is shown", () => {
  it("reads a well-formed row", () => {
    expect(rowToProfile(savedRow)).toEqual({
      resumeText: savedRow.resume_text, resumeName: "resume.pdf", tags: ["python", "sql"], tagsVersion: SKILLS_VERSION,
      updatedAt: "2026-11-11T18:00:00.000Z",
    });
    expect(rowToProfile({ ...savedRow, resume_name: null })?.resumeName).toBeNull();
  });

  it("refuses a row with a missing or mistyped field", () => {
    for (const bad of [null, "text", {}, { ...savedRow, resume_text: 5 }, { ...savedRow, tags: ["sql", 3] }, { ...savedRow, tags_version: "2" }, { ...savedRow, updated_at: "yesterday" }]) {
      expect(rowToProfile(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe("loadProfile", () => {
  it("reads the signed-in person's own row", async () => {
    const { db, calls } = fakeDb(savedRow);
    const result = await loadProfile(db, USER);
    expect(result).toEqual({ ok: true, value: rowToProfile(savedRow) });
    expect(calls).toEqual([`select ${PROFILE_TABLE} (resume_text, resume_name, tags, tags_version, updated_at) where user_id=${USER}`]);
  });

  it("is an empty profile, not an error, when nothing is saved yet", async () => {
    expect(await loadProfile(fakeDb(null).db, USER)).toEqual({ ok: true, value: null });
  });

  it.each(["refused", "offline"] as const)("gives a message to show and logs the cause when the read is %s", async (mode) => {
    expect(await loadProfile(fakeDb(savedRow, mode).db, USER)).toEqual({ ok: false, message: PROFILE_COPY.loadFailed });
    expect(logged).toHaveBeenCalledOnce();
  });

  it("says so when the row cannot be read, instead of showing half of it", async () => {
    expect(await loadProfile(fakeDb({ resume_text: 5 }).db, USER)).toEqual({ ok: false, message: PROFILE_COPY.loadFailed });
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("saveProfile", () => {
  it("writes the cleaned text, its tags and the vocabulary version into the person's one row", async () => {
    const { db, calls, written } = fakeDb(null);
    const result = await saveProfile(db, USER, { text: `\n${RESUME}\u0000  \n`, name: "/tmp/resume.pdf" });
    expect(calls).toEqual([`upsert ${PROFILE_TABLE} on user_id`]);
    expect(written[0]).toEqual({
      user_id: USER, resume_text: RESUME.trim(), resume_name: "resume.pdf",
      tags: expect.arrayContaining(["econometrics", "python", "regression", "sql", "stata"]), tags_version: SKILLS_VERSION,
    });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ resumeText: RESUME.trim(), updatedAt: "2026-11-11T18:00:00.000Z" }) });
  });

  it("replaces: a second save goes to the same row, never a second one", async () => {
    const { db, calls, written } = fakeDb(savedRow);
    await saveProfile(db, USER, { text: RESUME, name: "resume.pdf" });
    await saveProfile(db, USER, { text: `${RESUME} Tableau`, name: null });
    expect(calls).toEqual([`upsert ${PROFILE_TABLE} on user_id`, `upsert ${PROFILE_TABLE} on user_id`]);
    expect(written[1]).toMatchObject({ user_id: USER, resume_name: null });
    expect(written[1].tags).toContain("tableau");
  });

  it("does not send a text that is empty, too short or too long, and says why", async () => {
    const { db, calls } = fakeDb(null);
    expect(await saveProfile(db, USER, { text: "  ", name: null })).toEqual({ ok: false, message: PROFILE_COPY.emptyText });
    expect(await saveProfile(db, USER, { text: "too short", name: null })).toEqual({ ok: false, message: PROFILE_COPY.tooShort });
    expect(await saveProfile(db, USER, { text: "a".repeat(MAX_RESUME_CHARS + 1), name: null })).toEqual({ ok: false, message: PROFILE_COPY.tooLong });
    expect(calls).toEqual([]);
  });

  it.each(["refused", "offline"] as const)("gives a message to show and logs the cause when the write is %s", async (mode) => {
    const result = await saveProfile(fakeDb(null, mode).db, USER, { text: RESUME, name: null });
    expect(result).toEqual({ ok: false, message: PROFILE_COPY.saveFailed });
    expect(logged).toHaveBeenCalledOnce();
  });

  it("never logs the resume itself", async () => {
    await saveProfile(fakeDb(null, "refused").db, USER, { text: RESUME, name: "resume.pdf" });
    expect(JSON.stringify(logged.mock.calls)).not.toContain("Econometrics");
  });
});

describe("deleteProfile", () => {
  it("removes the person's row", async () => {
    const { db, calls } = fakeDb(savedRow);
    expect(await deleteProfile(db, USER)).toEqual({ ok: true, value: null });
    expect(calls).toEqual([`delete ${PROFILE_TABLE} where user_id=${USER}`]);
  });

  it.each(["refused", "offline"] as const)("gives a message to show and logs the cause when the delete is %s", async (mode) => {
    expect(await deleteProfile(fakeDb(savedRow, mode).db, USER)).toEqual({ ok: false, message: PROFILE_COPY.deleteFailed });
    expect(logged).toHaveBeenCalledOnce();
  });
});
