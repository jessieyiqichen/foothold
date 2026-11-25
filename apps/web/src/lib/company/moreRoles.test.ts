import { describe, expect, it } from "vitest";
import type { CardRole } from "../cards/types";
import type { Level } from "../profile/roles";
import { kindWord, moreRoleRows, shortAge, shownRows } from "./moreRoles";
import { ROLES_SHOWN } from "./roles";

const NOW = new Date("2026-11-23T12:00:00Z");
const role = (id: string, postedAt: string | null, level: Level = "entry"): CardRole =>
  ({ id, title: `Role ${id}`, url: `https://x.co/${id}`, postedAt, family: null, level, shared: [] });

// In fh_company's order: best fit first
const roles = [
  role("1", "2026-11-01T00:00:00Z"),
  role("2", "2026-11-20T00:00:00Z", "intern"),
  role("3", null, "unspecified"),
  role("4", "2026-09-10T00:00:00Z", "senior"),
];

describe("moreRoleRows: the company's other roles, one line each", () => {
  it("leaves out the role the page is about", () => {
    expect(moreRoleRows(roles, "2", "mine", NOW).map((r) => r.id)).toEqual(["1", "3", "4"]);
  });

  it("keeps the best-fit order signed in", () => {
    expect(moreRoleRows(roles, null, "mine", NOW).map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("puts the newest first signed out, undated last", () => {
    expect(moreRoleRows(roles, null, "public", NOW).map((r) => r.id)).toEqual(["2", "1", "4", "3"]);
  });

  it("links each to its role page, with the two short words", () => {
    expect(moreRoleRows(roles, "1", "mine", NOW)).toEqual([
      { id: "2", title: "Role 2", href: "/roles/2", kind: "Internship", age: "3 days" },
      { id: "3", title: "Role 3", href: "/roles/3", kind: null, age: null },
      { id: "4", title: "Role 4", href: "/roles/4", kind: "Full-time", age: "2 mo" },
    ]);
  });

  it("names a role with no title as the card does", () => {
    expect(moreRoleRows([{ ...role("9", null), title: null }], null, "mine", NOW)[0]?.title).toBe("Role from a Hacker News hiring post");
  });

  it("does not change its input", () => {
    const copy = [...roles];
    moreRoleRows(roles, null, "public", NOW);
    expect(roles).toEqual(copy);
  });
});

describe("shownRows: the first few, then See all", () => {
  const rows = Array.from({ length: 8 }, (_, i) => i);

  it("cuts at the first five and counts the whole list", () => {
    expect(shownRows(rows, false)).toEqual({ shown: rows.slice(0, ROLES_SHOWN), hidden: 3 });
  });

  it("shows all once opened, or when there are few", () => {
    expect(shownRows(rows, true)).toEqual({ shown: rows, hidden: 0 });
    expect(shownRows(rows.slice(0, 5), false)).toEqual({ shown: rows.slice(0, 5), hidden: 0 });
  });
});

describe("kindWord", () => {
  it("says Internship or Full-time, nothing when the level is unknown", () => {
    expect(kindWord("intern")).toBe("Internship");
    expect(kindWord("entry")).toBe("Full-time");
    expect(kindWord("senior")).toBe("Full-time");
    expect(kindWord("management")).toBe("Full-time");
    expect(kindWord("unspecified")).toBeNull();
  });
});

describe("shortAge", () => {
  it("says the age in a word or two", () => {
    expect(shortAge("2026-11-23T08:00:00Z", NOW)).toBe("today");
    expect(shortAge("2026-11-22T08:00:00Z", NOW)).toBe("1 day");
    expect(shortAge("2026-11-17T08:00:00Z", NOW)).toBe("6 days");
    expect(shortAge("2026-11-02T08:00:00Z", NOW)).toBe("3 wk");
    expect(shortAge("2026-09-20T08:00:00Z", NOW)).toBe("2 mo");
    expect(shortAge("2025-01-01T08:00:00Z", NOW)).toBe("1 yr+");
  });

  it("gives nothing for an unknown date", () => {
    expect(shortAge(null, NOW)).toBeNull();
    expect(shortAge("not a date", NOW)).toBeNull();
  });
});
