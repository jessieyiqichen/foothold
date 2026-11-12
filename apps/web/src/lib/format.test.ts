import { describe, expect, it } from "vitest";
import { formatCount } from "./format";

describe("formatCount", () => {
  it("keeps the plural for zero and many", () => {
    expect(formatCount(0, "connections")).toBe("0 connections");
    expect(formatCount(11, "connections")).toBe("11 connections");
  });

  it("drops a trailing s for exactly one", () => {
    expect(formatCount(1, "connections")).toBe("1 connection");
    expect(formatCount(1, "applications")).toBe("1 application");
  });

  it("leaves units without a plural s alone", () => {
    expect(formatCount(1, "km")).toBe("1 km");
  });
});
