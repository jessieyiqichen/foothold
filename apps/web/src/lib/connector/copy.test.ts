// House style: no full stops; errors take no "!" and say what to do next.
import { describe, expect, it } from "vitest";
import { DAILY_DRAFT_LIMIT } from "./constants";
import { CONSENT_LINES, DRAFT_COPY, DRAFT_ERRORS } from "./copy";

const FULL_STOP = /\.(\s|$)/;

describe("draft lines", () => {
  it("have no full stop, and the errors no \"!\", each saying what to do next", () => {
    for (const line of Object.values(DRAFT_COPY)) expect(line, line).not.toMatch(FULL_STOP);
    for (const line of DRAFT_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });

  it("states the daily limit from the constant, as tries", () => {
    expect(DRAFT_COPY.limit).toContain(`${DAILY_DRAFT_LIMIT} tries`);
    expect(DRAFT_COPY.limit).not.toMatch(/drafts written/);
    expect(DRAFT_COPY.limit).toContain("midnight UTC");
    expect(DRAFT_COPY.limit).not.toContain("tomorrow");
  });

  it("tells a model that could not be reached apart from a draft that failed its checks", () => {
    expect(DRAFT_COPY.unavailable).toBe("I couldn't reach the writing model, try again later");
    expect(DRAFT_COPY.unverified).toBe("The draft didn't hold up to checking, try again");
  });

  it("says what is sent where before the first draft, in the agreed words (2026-11-16, changed with the harness on 2026-11-21, pending the user's yes), one sentence a line", () => {
    expect(CONSENT_LINES).toEqual([
      "To write this, Foothold sends your resume's experience to Google Gemini, with your one line about you and the changes you made to earlier messages",
      "Your name, email, phone, links and sign-offs are taken out first",
      "On Gemini's free tier, Google may keep what is sent and people at Google may read it",
      "You must be 18 or older",
    ]);
    expect(DRAFT_COPY.sendsLine).toBe("Sends your experience, without contact details, to Google Gemini");
    expect(DRAFT_COPY.agree).toBe("Send and write");
    expect(DRAFT_COPY.notNow).toBe("Not now");
    for (const line of CONSENT_LINES) expect(line, line).not.toMatch(FULL_STOP);
  });

  it("says plainly that nothing is sent", () => {
    expect(DRAFT_COPY.neverSends).toBe("Foothold never sends anything for you");
  });
});
