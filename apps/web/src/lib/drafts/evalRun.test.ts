import { describe, expect, it, vi } from "vitest";
import { runCase, summarize, type CaseResult, type EvalCase } from "./evalRun";
import type { JudgeInput, Verdict } from "./judge";

const c: EvalCase = { company_id: 1, role_id: 2, company: "Acme", title: "PM", kind: "product" };
const input = { resumeText: "Jessie Chen\nBuilt evals", company: { name: "Acme", oneLiner: "Agents", description: null }, roles: [{ title: "PM" }], person: null, posting: { title: "PM", text: "Run evals" } };
const draft = { subject: "PM: evals", body: "I'm a student.", resumeQuote: "Built evals", companyQuote: "Agents", model: "m" };
const verdict = (pass: boolean, score: number): Verdict => ({ truthful: { pass: true, problems: [] }, human: { pass, problems: [] }, letterFit: { pass: true, why: "" }, roleFit: { pass: true, why: "" }, replyScore: score, replyWhy: "", dropped: 0, pass });

describe("runCase", () => {
  it("gathers, writes and judges, with the resume's name line out of the judge's view", async () => {
    const judge = vi.fn<(input: JudgeInput) => Promise<Verdict>>(async () => verdict(true, 4));
    const r = await runCase(c, { gather: async () => input, generate: async () => ({ ok: true, draft }), judge, now: () => 0 });
    expect(r).toMatchObject({ outcome: "written", draft, verdict: { pass: true } });
    expect(judge.mock.calls[0][0].resume).not.toContain("Jessie Chen");
    expect(judge.mock.calls[0][0].posting).toContain("Run evals");
  });
  it("records a refused case and a draft that did not pass the checks, without judging", async () => {
    const judge = vi.fn();
    expect((await runCase(c, { gather: async () => ({ status: 400, body: { error: "x" } }), generate: vi.fn(), judge })).outcome).toBe("refused");
    expect((await runCase(c, { gather: async () => input, generate: async () => ({ ok: false, reason: "unverified" }), judge })).outcome).toBe("unverified");
    expect(judge).not.toHaveBeenCalled();
  });
});

describe("summarize", () => {
  it("counts written, passed, each failed check and the mean reply score", () => {
    const rs = [
      { case: c, outcome: "written", ms: 1, verdict: verdict(true, 4) },
      { case: c, outcome: "written", ms: 1, verdict: verdict(false, 2) },
      { case: c, outcome: "unverified", ms: 1 },
    ] as CaseResult[];
    expect(summarize(rs)).toEqual({ cases: 3, written: 2, notWritten: 1, judged: 2, passed: 1, failedTruthful: 0, failedHuman: 1, failedLetterFit: 0, roleShort: 0, meanReply: 3, dropped: 0 });
  });
});
