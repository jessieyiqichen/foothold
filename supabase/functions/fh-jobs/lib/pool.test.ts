import { describe, expect, it } from "vitest";
import { settleLimited } from "./pool";

describe("settleLimited", () => {
  it("runs at most `limit` at once and keeps the input order in its results", async () => {
    let running = 0;
    let most = 0;
    const work = async (n: number) => {
      running++; most = Math.max(most, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      if (n === 3) throw new Error("three");
      return n * 10;
    };
    const out = await settleLimited([1, 2, 3, 4, 5, 6, 7], 3, work);
    expect(most).toBe(3);
    expect(out.map((r) => (r.status === "fulfilled" ? r.value : String(r.reason)))).toEqual([10, 20, "Error: three", 40, 50, 60, 70]);
  });
  it("handles an empty list and a limit above the list's length", async () => {
    expect(await settleLimited([], 5, async () => 1)).toEqual([]);
    expect(await settleLimited([1], 5, async (n) => n)).toEqual([{ status: "fulfilled", value: 1 }]);
  });
});
