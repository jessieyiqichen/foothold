import { describe, expect, it } from "vitest";
import { row } from "../cards/testRow";
import { readCompany } from "./rows";

const many = Array.from({ length: 12 }, (_, i) => ({ ...row.roles[0], id: 100 + i, title: `Role ${i}` }));
const page = { ...row, roles: many, best_role: 105, decision: "saved", decided_at: "2026-11-20T10:00:00Z" };

describe("readCompany: one company's page from fh_company", () => {
  it("keeps every role, not only the card's two", () => {
    expect(readCompany([page])?.card.roles).toHaveLength(12);
  });
  it("reads the best role and the person's decision", () => {
    expect(readCompany([page])).toMatchObject({ bestRole: "105", decision: "saved", decidedAt: "2026-11-20T10:00:00Z" });
  });
  it("reads no decision and no best role as null", () => {
    expect(readCompany([{ ...page, best_role: null, decision: null, decided_at: null }])).toMatchObject({ bestRole: null, decision: null, decidedAt: null });
  });
  it("reads a skipped company as not decided, so it can be saved again", () => {
    expect(readCompany([{ ...page, decision: "skipped" }])?.decision).toBe("skipped");
  });
  it("is null when there is no such company or the row cannot be read", () => {
    expect(readCompany([])).toBeNull();
    expect(readCompany(null)).toBeNull();
    expect(readCompany([{ ...page, name: "" }])).toBeNull();
    expect(readCompany([{ ...page, decision: "maybe" }])).toBeNull();
  });
});
