import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type AtsJob, JOBS_PER_COMPANY_MAX, PARSERS } from "./parse";
import { labelled, listedCount, planRefresh, type StoredRole } from "./refresh";
import { familyOf, levelOf, ROLES_VERSION } from "../../../../packages/core/src/roles";

const json = (name: string) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
const job = (id: string, over: Partial<AtsJob> = {}): AtsJob =>
  ({ id, title: `Role ${id}`, location: null, text: `Text ${id}`, url: `https://x.io/${id}`, postedAt: "2026-11-01T00:00:00.000Z", ...over });
const hashOf = (j: AtsJob) => `sha:${j.text}`;
/** A stored row as fh_stored_roles returns it, matching job(id) unless told otherwise. */
const stored = (id: number, key: string, over: Partial<StoredRole> = {}): StoredRole => ({
  id, sourceId: `ashby:acme:${key}`, closedAt: null, title: `Role ${key}`, postedAt: "2026-11-01T00:00:00+00:00",
  textSha256: `sha:Text ${key}`, ...over,
});
const base = { ats: "ashby" as const, slug: "acme", needsDetail: false };
const plan = (stored: StoredRole[], jobs: AtsJob[], listed: number | null = jobs.length, needsDetail = false) =>
  planRefresh({ ...base, needsDetail, stored, jobs, listed, hashes: new Map(jobs.map((j) => [j.id, hashOf(j)])) });

describe("listedCount", () => {
  it("counts the rows each system's answer lists, before any is dropped", () => {
    expect(listedCount("ashby", json("ashby.json"))).toBe(2);
    expect(listedCount("greenhouse", json("greenhouse.json"))).toBe(2);
    expect(listedCount("lever", json("lever.json"))).toBe(2);
    expect(listedCount("rippling", json("rippling.json"))).toBe(3);
    expect(listedCount("gem", json("gem.json"))).toBe(1);
    expect(listedCount("bamboohr", json("bamboohr.json"))).toBe(3);
    expect(listedCount("workable", json("workable.json"))).toBe(2);
  });
  it("says null for an answer that is not the shape the system sends", () => {
    for (const raw of [null, "Not Found", 7, {}, { jobs: "x" }, [1]]) {
      expect(listedCount("ashby", raw)).toBeNull();
      expect(listedCount("bamboohr", raw)).toBeNull();
    }
    expect(listedCount("lever", { jobs: [] })).toBeNull();
    expect(listedCount("lever", [])).toBe(0);
  });
});

describe("planRefresh: what to write", () => {
  it("writes nothing for roles stored exactly as the board lists them", () => {
    expect(plan([stored(1, "a")], [job("a")])).toEqual({ ok: true, upsert: [], reopen: [], close: [] });
  });
  it("writes a new role, and a role whose title, text or date changed", () => {
    const jobs = [job("new"), job("t", { title: "Renamed" }), job("x", { text: "Edited" }), job("d", { postedAt: "2026-11-09T00:00:00Z" })];
    const p = plan([stored(1, "t"), stored(2, "x"), stored(3, "d")], jobs);
    expect(p.ok && p.upsert.map((j) => j.id)).toEqual(["new", "t", "x", "d"]);
  });
  it("treats the same moment written two ways as unchanged", () => {
    expect(plan([stored(1, "a", { postedAt: "2026-11-01T00:00:00.000Z" })], [job("a", { postedAt: "2026-11-01T00:00:00+00:00" })]))
      .toMatchObject({ upsert: [] });
  });
  it("on a system whose list has no texts, compares only the title and a date the list gives", () => {
    const jobs = [job("a", { text: "Role a", postedAt: null }), job("b", { title: "Renamed", postedAt: null })];
    const p = plan([stored(1, "a"), stored(2, "b")], jobs, 2, true);
    expect(p.ok && p.upsert.map((j) => j.id)).toEqual(["b"]);
  });
});

describe("planRefresh: closing and re-opening", () => {
  it("closes the open roles the board no longer lists, and only those", () => {
    const p = plan([stored(1, "a"), stored(2, "b"), stored(3, "c", { closedAt: "2026-11-13T06:00:00Z" })], [job("a")]);
    expect(p).toEqual({ ok: true, upsert: [], reopen: [], close: [2] });
  });
  it("re-opens an unchanged closed role that came back, by id; a changed one through the write", () => {
    const closed = { closedAt: "2026-11-13T06:00:00Z" };
    const p = plan([stored(3, "c", closed), stored(4, "d", closed)], [job("c"), job("d", { title: "New title" })]);
    expect(p.ok && { upsert: p.upsert.map((j) => j.id), reopen: p.reopen }).toEqual({ upsert: ["d"], reopen: [3] });
  });
  it("closes a role stored under another board name of the same company", () => {
    expect(plan([stored(9, "z", { sourceId: "lever:acme-old:z" })], [job("a")])).toMatchObject({ close: [9] });
  });
  it("closes everything when the board answers, in its own shape, with no roles at all", () => {
    expect(plan([stored(1, "a")], [], 0)).toEqual({ ok: true, upsert: [], reopen: [], close: [1] });
  });
  it("closes nothing when the answer is not the system's shape", () => {
    expect(plan([stored(1, "a")], [], null)).toEqual({ ok: false, reason: "the board's answer was not a job list" });
  });
  it("closes nothing when the board lists roles but the parser kept none", () => {
    expect(plan([stored(1, "a")], [], 4)).toEqual({ ok: false, reason: "the board listed 4 rows and none could be read" });
  });
  it("closes nothing when the list was cut at the per-company limit, since the rest were never read", () => {
    const many = Array.from({ length: JOBS_PER_COMPANY_MAX }, (_, i) => job(`j${i}`));
    const p = plan([stored(1, "gone")], many, 450);
    expect(p).toMatchObject({ ok: true, close: [] });
    expect(p.ok && p.upsert).toHaveLength(JOBS_PER_COMPANY_MAX);
  });
  it("works on a real answer end to end", () => {
    const raw = json("ashby.json");
    const jobs = PARSERS.ashby(raw, "posthog");
    const p = planRefresh({ ats: "ashby", slug: "posthog", needsDetail: false, jobs, listed: listedCount("ashby", raw), hashes: new Map(),
      stored: [{ id: 5, sourceId: "ashby:posthog:gone", closedAt: null, title: "Gone", postedAt: null, textSha256: null }] });
    expect(p).toMatchObject({ ok: true, close: [5] });
    expect(p.ok && p.upsert).toHaveLength(2);
  });
  it("keeps the stored rows untouched", () => {
    const rows = [stored(1, "a")];
    plan(rows, [], 0);
    expect(rows).toEqual([stored(1, "a")]);
  });
});

describe("labelled", () => {
  it("labels a role's family and level from its title, with the rules' version", () => {
    for (const title of ["Senior Data Engineer", "Software Engineering Intern", "Account Executive"]) {
      expect(labelled(title)).toEqual({ family: familyOf(title), level: levelOf(title), roles_version: ROLES_VERSION });
    }
    expect(labelled("Software Engineering Intern").level).toBe("intern");
  });
});
