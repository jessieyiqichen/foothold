import { describe, expect, it } from "vitest";
import { FAMILIES, LEVELS } from "../profile/roles";
import { FAMILY_TILE, familyTileClass, LEVEL_TILE_CLASS, TILE_TEXT } from "./tiles";

describe("FAMILY_TILE: one fixed colour for each kind of work", () => {
  it("gives every family a colour", () => {
    for (const { id } of FAMILIES) expect(FAMILY_TILE[id], id).toBeDefined();
  });

  it("never uses red, which passes only for large text and a family label is small", () => {
    expect(Object.values(FAMILY_TILE)).not.toContain("red");
  });

  it("colours neighbouring kinds of work alike, so the list reads in three groups", () => {
    expect(new Set(["engineering", "data", "research"].map((id) => FAMILY_TILE[id as keyof typeof FAMILY_TILE]))).toEqual(new Set(["cobalt"]));
    expect(new Set(["product", "design", "marketing", "sales"].map((id) => FAMILY_TILE[id as keyof typeof FAMILY_TILE]))).toEqual(new Set(["mustard"]));
    expect(new Set(["customer", "operations", "finance", "people", "legal"].map((id) => FAMILY_TILE[id as keyof typeof FAMILY_TILE]))).toEqual(new Set(["green"]));
    expect(FAMILY_TILE.other).toBe("off");
  });

  it("sets the text colour that passes on each tile: light on cobalt and green, ink on mustard and the sheet", () => {
    expect(TILE_TEXT).toEqual({ cobalt: "text-tile-off", green: "text-tile-off", mustard: "text-ink", off: "text-ink" });
    expect(familyTileClass("research")).toContain("bg-tile-cobalt");
    expect(familyTileClass("research")).toContain("text-tile-off");
    expect(familyTileClass("product")).toContain("text-ink");
  });
});

describe("LEVEL_TILE_CLASS", () => {
  it("is one plain tile for every level, so only the family carries colour", () => {
    expect(LEVELS.length).toBeGreaterThan(0);
    expect(LEVEL_TILE_CLASS).toContain("bg-surface");
    expect(LEVEL_TILE_CLASS).toContain("text-ink");
  });
});
