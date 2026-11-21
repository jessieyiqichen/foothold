import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROFILE_COPY } from "../profile/copy";
import { clearEdits, loadEdits, rowToEdit } from "./edits";

const row = { id: 7, before_subject: "Hi", before_body: "Old", after_subject: "Hello", after_body: "New", created_at: "2026-11-21T10:00:00Z" };
let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logged = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => logged.mockRestore());

describe("kept edits", () => {
  it("reads a row and drops one it cannot read", () => {
    expect(rowToEdit(row)).toEqual({ id: 7, before: { subject: "Hi", body: "Old" }, after: { subject: "Hello", body: "New" }, createdAt: "2026-11-21T10:00:00Z" });
    expect(rowToEdit({ ...row, after_body: "" })).toBeNull();
  });
  it("loads the person's five newest, and says so when it cannot", async () => {
    const limit = vi.fn(async () => ({ data: [row, { id: 8 }], error: null }));
    const eq = vi.fn(() => ({ order: () => ({ limit }) }));
    const db = { from: () => ({ select: () => ({ eq }) }) } as never;
    expect((await loadEdits(db, "u")).ok).toBe(true);
    expect(eq).toHaveBeenCalledWith("user_id", "u");
    expect(limit).toHaveBeenCalledWith(5);
    const broken = { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: null, error: { message: "no" } }) }) }) }) }) } as never;
    expect(await loadEdits(broken, "u")).toEqual({ ok: false, message: PROFILE_COPY.memoryFailed });
  });
  it("clears only the person's own", async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const db = { from: () => ({ delete: () => ({ eq }) }) } as never;
    expect(await clearEdits(db, "u")).toEqual({ ok: true, value: null });
    expect(eq).toHaveBeenCalledWith("user_id", "u");
  });
});
