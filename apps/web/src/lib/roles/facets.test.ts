import { describe, expect, it } from "vitest";
import { pickedTotal, readFacets } from "./facets";

const rows = [
  { facet: "family", value: "product", n: 120 }, { facet: "family", value: "data", n: 80 },
  { facet: "level", value: "entry", n: 40 }, { facet: "level", value: "senior", n: 90 },
  { facet: "days", value: "7", n: 20 }, { facet: "days", value: "30", n: 70 }, { facet: "days", value: "60", n: 150 }, { facet: "days", value: "any", n: 400 },
];

describe("readFacets: the counts beside each option", () => {
  it("reads counts by facet and value", () => {
    const facets = readFacets(rows);
    expect(facets?.family.get("product")).toBe(120);
    expect(facets?.level.get("senior")).toBe(90);
    expect(facets?.days.get("any")).toBe(400);
  });

  it("drops rows it does not know, and accepts a count sent as text", () => {
    const facets = readFacets([{ facet: "family", value: "wizardry", n: 3 }, { facet: "size", value: "big", n: 1 }, { facet: "level", value: "entry", n: "7" }, { facet: "days", value: "60", n: -1 }, null]);
    expect([...(facets?.family ?? [])]).toEqual([]);
    expect(facets?.level.get("entry")).toBe(7);
    expect(facets?.days.size).toBe(0);
  });

  it("is null when the answer is not a list", () => {
    expect(readFacets({})).toBeNull();
  });
});

describe("pickedTotal: the N in Show N roles", () => {
  const facets = readFacets(rows)!;

  it("adds the picked values, since each role has one kind of work and one level", () => {
    expect(pickedTotal(facets.family, ["product", "data"])).toBe(200);
    expect(pickedTotal(facets.level, ["entry"])).toBe(40);
  });

  it("adds every value when nothing is picked, as nothing picked means no filter", () => {
    expect(pickedTotal(facets.family, [])).toBe(200);
  });

  it("counts a value with no row as none", () => {
    expect(pickedTotal(facets.family, ["legal"])).toBe(0);
  });
});
