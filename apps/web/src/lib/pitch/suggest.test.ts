import { describe, expect, it, vi } from "vitest";
import { checkPitch, suggestPitch } from "./suggest";

const reply = (json: unknown) => new Response(JSON.stringify({ output_text: JSON.stringify(json) }), { status: 200 });
const RESUME = "Jessie Chen\njess@uchicago.edu\nMA in Computational Social Science, University of Chicago\nProduct intern at Droi Technology: built eval sets for an AI assistant";

describe("checkPitch", () => {
  it("passes a plain line", () => {
    expect(checkPitch("UChicago MA student (econ), interned as a PM on AI assistants, looking for AI product roles")).toEqual([]);
  });
  it("refuses contact details, I am, AI words and the wrong length", () => {
    expect(checkPitch("I am a UChicago student, reach me at jess@uchicago.edu")).toEqual([
      "the line must not contain an email address, a link or a phone number", 'the line must not start from "I am"',
    ]);
    expect(checkPitch("Short")).toContain("the line must be 20 to 200 characters");
    expect(checkPitch("UChicago student passionate about pivotal AI products")).toContain('the line uses the AI-sounding word "pivotal"');
  });
});

describe("suggestPitch", () => {
  it("sends the resume without name or contacts and returns a checked line", async () => {
    const f = vi.fn(async () => reply({ pitch: "UChicago MA student, interned as a PM on AI assistants, looking for AI product roles" }));
    expect(await suggestPitch(RESUME, { apiKey: "k", fetch: f, models: ["m1"] })).toEqual({ ok: true, pitch: "UChicago MA student, interned as a PM on AI assistants, looking for AI product roles" });
    const sent: string = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body)).input;
    expect(sent).not.toContain("Jessie Chen");
    expect(sent).not.toContain("jess@uchicago.edu");
  });
  it("asks once more with the reasons, then gives up as unverified", async () => {
    const f = vi.fn(async () => reply({ pitch: "I am a pivotal product leader" }));
    expect(await suggestPitch(RESUME, { apiKey: "k", fetch: f, models: ["m1"] })).toEqual({ ok: false, reason: "unverified" });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("moves to the next model when one becomes unavailable after a refused line", async () => {
    let n = 0;
    const f = vi.fn(async (_u: string, init: RequestInit) => {
      n += 1;
      const model = JSON.parse(String(init.body)).model;
      if (model === "m1") return n === 1 ? reply({ pitch: "I am pivotal" }) : new Response("{}", { status: 404 });
      return reply({ pitch: "UChicago MA student, interned as a PM on AI assistants" });
    }) as unknown as typeof fetch;
    expect(await suggestPitch(RESUME, { apiKey: "k", fetch: f, models: ["m1", "m2"] })).toEqual({ ok: true, pitch: "UChicago MA student, interned as a PM on AI assistants" });
  });
  it("needs a resume and a key", async () => {
    const f = vi.fn();
    expect(await suggestPitch("  ", { apiKey: "k", fetch: f, models: ["m1"] })).toEqual({ ok: false, reason: "bad_input" });
    expect(await suggestPitch(RESUME, { apiKey: "", fetch: f, models: ["m1"] })).toEqual({ ok: false, reason: "unavailable" });
    expect(f).not.toHaveBeenCalled();
  });
});
