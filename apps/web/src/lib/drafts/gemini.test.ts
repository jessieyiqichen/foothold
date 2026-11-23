import { describe, expect, it, vi } from "vitest";
import { askGemini, outputText } from "./gemini";

const answer = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("outputText: the model's text in an Interactions API reply", () => {
  it("reads output_text when present", () => {
    expect(outputText({ output_text: "{\"a\":1}" })).toBe("{\"a\":1}");
  });
  it("reads the last step's text blocks otherwise", () => {
    expect(outputText({ steps: [{ content: [{ type: "text", text: "x" }] }, { content: [{ type: "text", text: "{\"b\":" }, { type: "text", text: "2}" }] }] })).toBe("{\"b\":2}");
  });
  it("is null for anything else", () => {
    for (const v of [null, 1, {}, { steps: [] }, { steps: [{ content: [{ type: "image" }] }] }]) expect(outputText(v)).toBeNull();
  });
});

describe("askGemini", () => {
  const req = { apiKey: "k", model: "m1", system: "s", input: "i", schema: { type: "object" } };
  it("posts to the Interactions API with the key in a header, never in the URL", async () => {
    const f = answer(200, { output_text: "{\"ok\":true}" });
    expect(await askGemini({ ...req, fetch: f })).toEqual({ ok: true, json: { ok: true } });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect(url).not.toContain("k");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("k");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ model: "m1", system_instruction: "s", input: "i", response_format: { mime_type: "application/json", schema: { type: "object" } } });
  });
  it("maps 429 to rate_limited, 400/403/404 and an overload to unavailable, and a reply that is not JSON to bad_output", async () => {
    expect(await askGemini({ ...req, fetch: answer(429, {}) })).toEqual({ ok: false, reason: "rate_limited" });
    for (const s of [400, 403, 404]) expect(await askGemini({ ...req, fetch: answer(s, {}) })).toEqual({ ok: false, reason: "unavailable" });
    // An overloaded model ("high demand") moves on to the next one too (2026-11-22)
    for (const s of [500, 502, 503]) expect(await askGemini({ ...req, fetch: answer(s, {}) })).toEqual({ ok: false, reason: "unavailable" });
    expect(await askGemini({ ...req, fetch: answer(504, {}) })).toEqual({ ok: false, reason: "failed" });
    expect(await askGemini({ ...req, fetch: answer(200, { output_text: "not json" }) })).toEqual({ ok: false, reason: "bad_output" });
  });
  it("turns a network error or timeout into failed, never a throw", async () => {
    const f = vi.fn(async () => { throw new Error("boom"); });
    expect(await askGemini({ ...req, fetch: f })).toEqual({ ok: false, reason: "failed" });
  });
});
