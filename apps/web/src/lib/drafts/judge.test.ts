import { describe, expect, it } from "vitest";
import { readVerdict } from "./judge";

const email = { subject: "Product Manager: eval sets", body: "I'm a UChicago MA student writing about your Product Manager role. Built a 30-question eval set for a live AI assistant. Could we talk for 15 minutes?" };
const ok = { pass: true, problems: [] };
const base = { truthful: ok, human: ok, letter_fit: { pass: true, why: "Evals are the job" }, role_fit: { pass: true, why: "Entry level" }, reply_score: 4, reply_why: "Specific" };

describe("readVerdict: the judge's answer, its quotes checked", () => {
  it("passes a draft that passes all three checks, and keeps the reply score beside it", () => {
    expect(readVerdict(base, email)).toMatchObject({ pass: true, replyScore: 4, dropped: 0 });
  });
  it("keeps a problem whose quote is in the email, and fails the check", () => {
    const v = readVerdict({ ...base, human: { pass: false, problems: [{ quote: "Built a 30-question eval set for a live AI assistant", why: "no subject" }] } }, email);
    expect(v).toMatchObject({ pass: false, human: { pass: false, problems: [{ why: "no subject" }] } });
  });
  it("drops a problem whose quote is not in the email, and a fail with nothing left passes", () => {
    const v = readVerdict({ ...base, truthful: { pass: false, problems: [{ quote: "led a team of 40", why: "not in resume" }] } }, email);
    expect(v).toMatchObject({ pass: true, truthful: { pass: true, problems: [] }, dropped: 1 });
  });
  it("fails when the email picked the wrong experience, but not when the person is short of the role", () => {
    expect(readVerdict({ ...base, letter_fit: { pass: false, why: "Picked the launch metric" } }, email)?.pass).toBe(false);
    expect(readVerdict({ ...base, role_fit: { pass: false, why: "Wants 5 years" } }, email)).toMatchObject({ pass: true, roleFit: { pass: false } });
  });
  it("is null for a reply that is not a verdict", () => {
    expect(readVerdict({ ...base, reply_score: 9 }, email)).toBeNull();
    expect(readVerdict({ truthful: ok }, email)).toBeNull();
  });
});
