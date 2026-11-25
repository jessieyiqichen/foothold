import { describe, expect, it } from "vitest";
import type { CardRole } from "../cards/types";
import { startingRole } from "./roles";

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
