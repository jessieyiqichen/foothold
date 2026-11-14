import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type AtsJob, JOBS_PER_COMPANY_MAX, PARSERS } from "./parse";
import { listedCount, planRefresh, type StoredRole } from "./refresh";

const json = (name: string) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
const job = (id: string): AtsJob => ({ id, title: `Role ${id}`, location: null, text: `Role ${id}`, url: `https://x.io/${id}`, postedAt: null });
const stored = (id: number, job: string, closed = false): StoredRole =>
  ({ id, sourceId: `ashby:acme:${job}`, closedAt: closed ? "2026-11-13T06:00:00Z" : null });

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

describe("planRefresh", () => {
  const base = { ats: "ashby" as const, slug: "acme", needsDetail: false };

  it("closes the open roles the board no longer lists, and only those", () => {
    const plan = planRefresh({ ...base, stored: [stored(1, "a"), stored(2, "b"), stored(3, "c", true)], jobs: [job("a")], listed: 1 });
    expect(plan).toEqual({ ok: true, upsert: [job("a")], reopen: [], close: [2] });
  });
  it("re-opens a closed role that came back, through the upsert, when the system's list carries the text", () => {
    const plan = planRefresh({ ...base, stored: [stored(3, "c", true)], jobs: [job("c")], listed: 1 });
    expect(plan).toEqual({ ok: true, upsert: [job("c")], reopen: [], close: [] });
  });
  it("on a system whose texts are read one by one, writes only new roles and re-opens returning ones by id", () => {
    const plan = planRefresh({ ...base, needsDetail: true, stored: [stored(1, "a"), stored(3, "c", true), stored(4, "d")], jobs: [job("a"), job("c"), job("e")], listed: 3 });
    expect(plan).toEqual({ ok: true, upsert: [job("e")], reopen: [3], close: [4] });
  });
  it("closes a role stored under another board name of the same company", () => {
    const old: StoredRole = { id: 9, sourceId: "lever:acme-old:z", closedAt: null };
    expect(planRefresh({ ...base, stored: [old], jobs: [job("a")], listed: 1 })).toMatchObject({ close: [9] });
  });
  it("closes everything when the board answers, in its own shape, with no roles at all", () => {
    expect(planRefresh({ ...base, stored: [stored(1, "a")], jobs: [], listed: 0 })).toEqual({ ok: true, upsert: [], reopen: [], close: [1] });
  });
  it("closes nothing when the answer is not the system's shape", () => {
    expect(planRefresh({ ...base, stored: [stored(1, "a")], jobs: [], listed: null })).toEqual({ ok: false, reason: "the board's answer was not a job list" });
  });
  it("closes nothing when the board lists roles but the parser kept none", () => {
    expect(planRefresh({ ...base, stored: [stored(1, "a")], jobs: [], listed: 4 })).toEqual({ ok: false, reason: "the board listed 4 rows and none could be read" });
  });
  it("closes nothing when the list was cut at the per-company limit, since the rest were never read", () => {
    const many = Array.from({ length: JOBS_PER_COMPANY_MAX }, (_, i) => job(`j${i}`));
    const plan = planRefresh({ ...base, stored: [stored(1, "gone")], jobs: many, listed: 450 });
    expect(plan).toMatchObject({ ok: true, close: [] });
    expect(plan.ok && plan.upsert).toHaveLength(JOBS_PER_COMPANY_MAX);
  });
  it("works on a real answer end to end", () => {
    const raw = json("ashby.json");
    const jobs = PARSERS.ashby(raw, "posthog");
    const plan = planRefresh({ ats: "ashby", slug: "posthog", needsDetail: false, stored: [{ id: 5, sourceId: "ashby:posthog:gone", closedAt: null }], jobs, listed: listedCount("ashby", raw) });
    expect(plan).toMatchObject({ ok: true, close: [5] });
    expect(plan.ok && plan.upsert).toHaveLength(2);
  });
  it("keeps the stored rows untouched", () => {
    const rows = [stored(1, "a")];
    planRefresh({ ...base, stored: rows, jobs: [], listed: 0 });
    expect(rows).toEqual([stored(1, "a")]);
  });
});
