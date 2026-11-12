import { describe, expect, it } from "vitest";
import { didOne, goalSentence, headline, quickAmounts, singular } from "./phrases";

describe("singular", () => {
  it("makes the counted noun singular", () => {
    expect(singular("connection requests")).toBe("connection request");
    expect(singular("applications")).toBe("application");
    expect(singular("people about a coffee chat")).toBe("person about a coffee chat");
    expect(singular("interview questions")).toBe("interview question");
    expect(singular("km")).toBe("km");
  });
});

describe("headline", () => {
  it("reads as a full sentence with the verb", () => {
    expect(headline("Send", 11, "connection requests")).toBe("Send 11 connection requests");
    expect(headline("Message", 1, "people about a coffee chat")).toBe("Message 1 person about a coffee chat");
  });

  it("works without a verb", () => {
    expect(headline("", 3, "pages")).toBe("3 pages");
  });
});

describe("goalSentence", () => {
  it("describes a by-date goal", () => {
    expect(goalSentence({ verb: "Send", unit: "connection requests", type: "by-date", target: 500, deadline: "2026-12-01" })).toBe(
      "I want to send 500 connection requests by Dec 1",
    );
  });

  it("describes a daily goal", () => {
    expect(goalSentence({ verb: "Practice", unit: "interview questions", type: "daily", target: 2, deadline: null })).toBe(
      "I want to practice 2 interview questions every day",
    );
  });
});

describe("goalSentence while typing", () => {
  it("waits for a verb and a valid number", () => {
    expect(goalSentence({ verb: "", unit: "times", type: "daily", target: 3, deadline: null })).toBe("I want to \u2026");
    expect(goalSentence({ verb: "Read", unit: "pages", type: "daily", target: null, deadline: null })).toBe("I want to read some pages every day");
  });
});

describe("quickAmounts", () => {
  it("offers the same small steps every time, then everything that's left (first-run check 2: +3 +4 All 5 looked arbitrary)", () => {
    expect(quickAmounts(11)).toEqual([2, 3, 5, 11]);
    expect(quickAmounts(5)).toEqual([2, 3, 5]);
    expect(quickAmounts(30)).toEqual([2, 3, 5, 30]);
  });

  it("does not repeat amounts for small numbers", () => {
    expect(quickAmounts(3)).toEqual([2, 3]);
    expect(quickAmounts(2)).toEqual([2]);
    expect(quickAmounts(1)).toEqual([1]);
  });

  it("offers small steps when nothing is left today", () => {
    expect(quickAmounts(0)).toEqual([1, 2, 5]);
  });
});

describe("didOne: the one button that logs, in the task's own words", () => {
  it("puts the goal's verb in the past", () => {
    expect(didOne("Send")).toBe("I sent one");
    expect(didOne("Message")).toBe("I messaged one");
    expect(didOne("Practice")).toBe("I practiced one");
    expect(didOne("Write")).toBe("I wrote one");
    expect(didOne("Apply")).toBe("I applied to one");
  });

  it("falls back to plain words for a verb it does not know, or none", () => {
    expect(didOne("Juggle")).toBe("I did one");
    expect(didOne("")).toBe("I did one");
  });
});
