import { describe, expect, it } from "vitest";
import type { CardRole } from "../cards/types";
import { pickerRoles, ROLES_SHOWN, startingRole } from "./roles";

const role = (id: string): CardRole => ({ id, title: `Role ${id}`, url: `https://x.co/${id}`, postedAt: null, family: null, level: "unspecified", shared: [] });
const roles = ["1", "2", "3", "4", "5", "6", "7", "8"].map(role);

describe("startingRole", () => {
  it("starts with the role asked for, then the best fit, then the first", () => {
    expect(startingRole(roles, "7", "2")).toBe("7");
    expect(startingRole(roles, null, "2")).toBe("2");
    expect(startingRole(roles, "99", null)).toBe("1");
    expect(startingRole([], "7", "2")).toBeNull();
  });
});

describe("pickerRoles", () => {
  it("shows the first few and counts the rest", () => {
    expect(pickerRoles(roles, "1", false)).toEqual({ shown: roles.slice(0, ROLES_SHOWN), more: 3 });
  });
  it("keeps the chosen role in view", () => {
    const { shown, more } = pickerRoles(roles, "8", false);
    expect(shown.map((r) => r.id)).toEqual(["1", "2", "3", "4", "8"]);
    expect(more).toBe(3);
  });
  it("shows all once opened, and a short list whole", () => {
    expect(pickerRoles(roles, "1", true).shown).toHaveLength(8);
    expect(pickerRoles(roles.slice(0, 3), "1", false)).toEqual({ shown: roles.slice(0, 3), more: 0 });
  });
});
