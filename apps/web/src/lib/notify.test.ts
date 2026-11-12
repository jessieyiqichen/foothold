import { describe, expect, it } from "vitest";
import { planNotifications } from "./notify";

const at = (h: number, m = 0) => new Date(2026, 9, 17, h, m);

describe("planNotifications", () => {
  it("keeps only times still ahead today, plus a late last call", () => {
    const plan = planNotifications(at(12), ["10:00", "15:00", "20:00"]);
    expect(plan.map((p) => [p.at.getHours(), p.at.getMinutes(), p.level])).toEqual([
      [15, 0, "firmer"],
      [20, 0, "last-call"],
      [22, 30, "last-call"],
    ]);
  });

  it("does not add a last call before the latest chosen time", () => {
    const plan = planNotifications(at(9), ["10:00", "23:00"]);
    expect(plan.map((p) => p.at.getHours())).toEqual([10, 23]);
  });

  it("never plans more than four", () => {
    expect(planNotifications(at(6), ["07:00", "09:00", "11:00", "13:00", "15:00"])).toHaveLength(4);
  });

  it("plans nothing once the day is over", () => {
    expect(planNotifications(at(23, 45), ["10:00", "20:00"])).toEqual([]);
  });
});
