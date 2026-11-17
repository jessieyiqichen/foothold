import { describe, expect, it, vi } from "vitest";
import { consentKey, hasConsent, rememberConsent, type ConsentStorage } from "./consent";

/** A stand-in for localStorage; `broken` makes every call throw, as a blocked or private browser can. */
function storage(broken = false): ConsentStorage & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key) => { if (broken) throw new Error("blocked"); return items.get(key) ?? null; },
    setItem: (key, value) => { if (broken) throw new Error("blocked"); items.set(key, value); },
  };
}

describe("draft consent, kept in the browser for each person", () => {
  it("is one key per Clerk user", () => {
    expect(consentKey("user_2abc")).toBe("foothold.draftConsent.user_2abc");
  });

  it("is not given until the person agrees, and then is remembered for that person only", () => {
    const store = storage();
    expect(hasConsent("user_a", store)).toBe(false);
    expect(rememberConsent("user_a", store)).toBe(true);
    expect(hasConsent("user_a", store)).toBe(true);
    expect(hasConsent("user_b", store)).toBe(false);
  });

  it("counts only the value it writes, not anything else under the key", () => {
    const store = storage();
    store.items.set(consentKey("user_a"), "false");
    expect(hasConsent("user_a", store)).toBe(false);
  });

  it("asks every time when storage fails, and says the agreement was not kept", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = storage(true);
    expect(rememberConsent("user_a", store)).toBe(false);
    expect(hasConsent("user_a", store)).toBe(false);
    expect(hasConsent("user_a", null)).toBe(false);
    error.mockRestore();
  });

  it("is never given without a signed-in person", () => {
    const store = storage();
    expect(rememberConsent(null, store)).toBe(false);
    expect(hasConsent(null, store)).toBe(false);
  });
});
