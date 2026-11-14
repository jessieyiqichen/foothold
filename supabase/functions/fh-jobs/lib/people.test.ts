import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deobfuscate, peopleFromHnPost } from "./people";

// Real HN "Who is hiring" posts (November 2026), cut to the header and contact lines, every address replaced.
const posts = (JSON.parse(readFileSync(new URL("../fixtures/hn-posts.json", import.meta.url), "utf8")) as {
  posts: { id: string; text: string }[];
}).posts;
const post = (id: string) => posts.find((p) => p.id === id)!.text;

describe("deobfuscate", () => {
  it("turns the common written-out forms back into an address", () => {
    expect(deobfuscate("jobs[at]acme.org")).toBe("jobs@acme.org");
    expect(deobfuscate("jason [at] acme [dot] com")).toBe("jason@acme.com");
    expect(deobfuscate("caleb[dot]roe[at]acme[dot]com")).toBe("caleb.roe@acme.com");
    expect(deobfuscate("bk at proton dot me")).toBe("bk@proton.me");
    expect(deobfuscate("ann (at) acme (dot) io")).toBe("ann@acme.io");
  });
  it("leaves ordinary prose alone", () => {
    expect(deobfuscate("we work at Acme on payments, at scale")).toBe("we work at Acme on payments, at scale");
    expect(deobfuscate("reach me at the office")).toBe("reach me at the office");
    expect(deobfuscate("find me at acme dot com")).toBe("find me at acme dot com");
  });
});

describe("peopleFromHnPost", () => {
  it("reads a bracketed address, and the poster's name and role from their introduction", () => {
    expect(peopleFromHnPost(post("50348145"))).toEqual([{ email: "caleb.roe@example-valis.com", name: "Caleb", role: "co-founder/CTO" }]);
  });
  it("gives an address written after 'me' to the poster, even with no name stated", () => {
    expect(peopleFromHnPost(post("50339383"))).toEqual([{ email: "john.doe@example-health.ai", name: null, role: null }]);
    expect(peopleFromHnPost(post("50353098"))).toEqual([{ email: "jason@example-clad.com", name: null, role: null }]);
    expect(peopleFromHnPost(post("50342576"))).toEqual([{ email: "vance@example-bird.us", name: null, role: null }]);
  });
  it("reads 'name at domain dot tld'", () => {
    expect(peopleFromHnPost(post("50479794"))).toEqual([{ email: "bkroe@example.me", name: null, role: null }]);
  });
  it("keeps a team inbox, but never puts the poster's name on it", () => {
    expect(peopleFromHnPost(post("50338775"))).toEqual([{ email: "jobs@example-edu.org", name: null, role: null }]);
    expect(peopleFromHnPost(post("50340892"))).toEqual([{ email: "hiring@example-ledge.com", name: null, role: null }]);
    expect(peopleFromHnPost(post("50341345"))).toEqual([{ email: "jobs@example-sad.com", name: null, role: null }]);
  });
  it("puts the stated role on the one personal address in the post", () => {
    expect(peopleFromHnPost(post("50339750"))).toEqual([{ email: "pauli.roe@example-stream.io", name: null, role: "runs the Video team" }]);
  });
  it("returns nothing when the post gives no address, whatever the introduction says", () => {
    expect(peopleFromHnPost(post("50340101"))).toEqual([]);
    expect(peopleFromHnPost(post("50340419"))).toEqual([]);
  });
  it("matches a name to the address that carries it", () => {
    const text = "Acme | Engineer\nI'm Dana, CTO. Questions to dana@acme.io, applications to jobs@acme.io";
    expect(peopleFromHnPost(text)).toEqual([
      { email: "dana@acme.io", name: "Dana", role: "CTO" },
      { email: "jobs@acme.io", name: null, role: null },
    ]);
  });
  it("does not take a capitalised word after I'm for a name", () => {
    expect(peopleFromHnPost("I'm Hiring engineers. Write to me at a.b@acme.io")).toEqual([{ email: "a.b@acme.io", name: null, role: null }]);
  });
  it("drops placeholder addresses, repeats and anything that is not text", () => {
    expect(peopleFromHnPost("send to you@example.com or name@company.com; ann@acme.io, ANN@acme.io.")).toEqual([
      { email: "ann@acme.io", name: null, role: null },
    ]);
    expect(peopleFromHnPost(null)).toEqual([]);
    expect(peopleFromHnPost(42)).toEqual([]);
    expect(peopleFromHnPost("")).toEqual([]);
  });
  it("keeps every value inside the table's limits", () => {
    const long = `I'm Ann, ${"VP of ".repeat(1)}${"Product".padEnd(400, "x")}. ann@acme.io`;
    const [p] = peopleFromHnPost(long);
    expect(p.role!.length).toBeLessThanOrEqual(100);
    expect(peopleFromHnPost(`${"a".repeat(330)}@acme.io`)).toEqual([]);
  });
});
