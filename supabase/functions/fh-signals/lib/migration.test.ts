// The migrations repeat values the rules use. These tests fail when the two drift. They read the SQL files only.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUOTE_MAX } from "./sentences";
import { BOUNDS } from "./salary";
import { VISAS } from "./visa";
import { NEEDS_YEARS_MIN, YEARS_MAX } from "./years";
import { MODEL_TRIES_MAX, PENDING_MAX } from "./rows";
import { SIGNALS_MODEL } from "./model";

const read = (name: string) => readFileSync(new URL(`../../../migrations/${name}`, import.meta.url), "utf8");
const table = read("20261122200000_foothold_posting_signals.sql");
const reads = read("20261122200100_foothold_signals_reads.sql");
const companies = read("20261122200200_foothold_signals_companies.sql");

describe("the signals migrations", () => {
  it("never turn hide-years on by themselves: null means off, and no profile is read for it", () => {
    expect(table + reads + companies).not.toContain("fh_hide_years_default");
    const calls = [...reads.matchAll(/public\.fh_signals_filter\(([^;]*?)\) x;/g)].map((m) => m[1]);
    expect(calls).toHaveLength(3);
    for (const c of calls) expect(c.trim().endsWith(", false")).toBe(true);
  });
  it("bound the model's tries per row, give up by clearing pending, and reset the count on every write", () => {
    expect(table).toContain(`model_tries smallint not null default 0 check (model_tries between 0 and ${MODEL_TRIES_MAX})`);
    expect(table).toContain(`least(s.model_tries + 1, ${MODEL_TRIES_MAX})`);
    expect(table).toContain(`when s.model_tries + 1 >= ${MODEL_TRIES_MAX} then null`);
    expect(table).toContain("model_tries = 0");
    expect(table).toContain("grant execute on function public.fh_signals_model_failed(bigint[]) to service_role;");
  });
  it("refuse a pending entry with no kind, and report written, emptied and skipped", () => {
    expect(table).toContain("or e ->> 'kind' is null");
    expect(table).toMatch(/'written', [\s\S]*'emptied', [\s\S]*'skipped', /);
  });
  it("allow exactly the visa ids", () => {
    const m = /visa text check \(visa in \(([^)]*)\)\)/.exec(table);
    expect(m?.[1].match(/'([a-z_]+)'/g)?.map((s) => s.slice(1, -1))).toEqual([...VISAS]);
  });
  it("bound quotes, years, pending and salaries as the rules do", () => {
    expect(table.match(/char_length\((\w+_quote)\) between 1 and (\d+)/g)?.length).toBe(5);
    for (const m of table.matchAll(/char_length\(\w+_quote\) between 1 and (\d+)/g)) expect(Number(m[1])).toBe(QUOTE_MAX);
    expect(table).toContain(`years_min between 0 and ${YEARS_MAX}`);
    expect(table).toContain(`jsonb_array_length(pending) between 1 and ${PENDING_MAX}`);
    expect(table).toContain(`salary_min between ${BOUNDS.year.min} and ${BOUNDS.year.max}`);
    expect(table).toContain(`salary_min between ${BOUNDS.hour.min} and ${BOUNDS.hour.max}`);
  });
  it("accept the model's name as settled_by", () => {
    expect(new RegExp(/settled_by ~ '([^']+)'/.exec(table)?.[1] ?? "^$").test(SIGNALS_MODEL)).toBe(true);
  });
  it("use the same years threshold everywhere", () => {
    for (const sql of [reads, companies]) {
      const all = [...sql.matchAll(/years_min >= (\d+)/g)].map((m) => Number(m[1]));
      expect(all.length).toBeGreaterThan(0);
      expect(new Set(all)).toEqual(new Set([NEEDS_YEARS_MIN]));
    }
  });
  it("let the worker record its runs", () => {
    expect(table).toMatch(/fh_runs_source_check[\s\S]*'signals', 'signals-model'\)\)/);
  });
  it("keep only the worker able to claim and write", () => {
    for (const fn of ["fh_claim_signals(integer, integer)", "fh_set_signals(integer, jsonb)"]) {
      expect(table).toContain(`revoke all on function public.${fn} from public, anon, authenticated;`);
      expect(table).toContain(`grant execute on function public.${fn} to service_role;`);
    }
    expect(table).toContain("revoke all on table public.fh_posting_signals from public, anon, authenticated;");
    expect(table).not.toMatch(/grant [^;]*on table public\.fh_posting_signals to [^;]*anon/);
  });
  it("write an unsafe row empty, so it leaves the claim queue, and count only rows written with their values", () => {
    for (const col of ["years_min", "salary_min", "visa", "equity", "k401", "pending"]) expect(table).toContain(`case when c.ok then c.${col} end`);
    expect(table).toContain("'written', count(*) filter (where c.ok)");
    expect(table).toContain("from written w join checked c on c.posting_id = w.posting_id;");
  });
});

// fh_strip_emails' three patterns, run here in JavaScript: they use only constructs both engines read the same way
// (no \b, which means backspace in Postgres).
describe("fh_strip_emails", () => {
  const body = table.slice(table.indexOf("create function public.fh_strip_emails"), table.indexOf("revoke all on function public.fh_strip_emails"));
  const patterns = [...body.matchAll(/\n\s+'((?:[^']|'')+)', '', 'gi'\)/g)].map((m) => new RegExp(m[1].replace(/''/g, "'"), "gi"));
  const strip = (text: string) => patterns.reduce((t, re) => t.replace(re, ""), text);
  it("has three patterns", () => expect(patterns).toHaveLength(3));
  it("removes plain and disguised addresses", () => {
    expect(strip("Email jobs@acme.com today")).toBe("Email  today");
    expect(strip("Write to jane (at) acme.com today")).toBe("Write to  today");
    expect(strip("Write to jane [at] acme dot com today")).toBe("Write to  today");
    expect(strip("Write to jane {at} acme(dot)io today")).toBe("Write to  today");
    expect(strip("Write to jane at acme dot com today")).toBe("Write to  today");
    expect(strip("jane (at) acme.com. Next")).toBe(". Next");
  });
  it("leaves ordinary text alone", () => {
    for (const t of ["Meet us at Acme in Boston.", "Look at the dot plot.", "We work at scale (at least 1M users).", "Pay at $120k."]) expect(strip(t)).toBe(t);
  });
  it("is what every public quote goes through", () => {
    for (const q of ["years", "salary", "visa", "equity", "k401"]) {
      expect(table).toContain(`case when p_strip_emails then public.fh_strip_emails(s.${q}_quote) else s.${q}_quote end`);
    }
  });
});
