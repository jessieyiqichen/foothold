import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deobfuscate, headerDomains, linkAgrees, peopleFromHnPost } from "./people";

// HN posts in real shapes, every id, person, company and domain made up (.test is a reserved top-level domain).
const posts = (JSON.parse(readFileSync(new URL("../fixtures/hn-posts.json", import.meta.url), "utf8")) as {
  posts: { id: string; domain: string | null; text: string }[];
}).posts;
const run = (id: string) => {
  const p = posts.find((x) => x.id === id)!;
  return peopleFromHnPost(p.text, p.domain);
};

describe("deobfuscate", () => {
  it("turns the bracketed forms back into an address", () => {
    expect(deobfuscate("jobs[at]acme.test")).toBe("jobs@acme.test");
    expect(deobfuscate("dana [at] acme [dot] test")).toBe("dana@acme.test");
    expect(deobfuscate("ravi[dot]roe[at]acme[dot]test")).toBe("ravi.roe@acme.test");
    expect(deobfuscate("ann (at) acme (dot) test")).toBe("ann@acme.test");
  });
  it("reads bare 'name at domain dot tld' only right after a contact cue", () => {
    expect(deobfuscate("email: kofi at quillmail dot test")).toBe("email: kofi@quillmail.test");
    expect(deobfuscate("Send your resume to dana at acme dot test")).toBe("Send your resume to dana@acme.test");
    expect(deobfuscate("reach me at dana at acme dot test")).toBe("reach me at dana@acme.test");
  });
  it("never makes an address out of ordinary prose", () => {
    for (const s of [
      "We are hiring engineers at acme dot io this year.",
      "Backed by partners at a16z dot com and others.",
      "Our teams at acme dot io and beta dot com work together.",
      "find me at acme dot com",
      "we work at Acme on payments, at scale",
    ]) {
      expect(deobfuscate(s)).toBe(s);
      expect(peopleFromHnPost(s, "acme.io")).toEqual([]);
    }
  });
});

describe("headerDomains", () => {
  it("reads the domains named in the first line, leaving out hosted job boards", () => {
    expect(headerDomains("Fernhill (YC W23) | Engineer | NYC | fernhill.test\nmore")).toEqual(["fernhill.test"]);
    expect(headerDomains("Harborline | Data | https://www.harborline.test/careers")).toEqual(["harborline.test"]);
    expect(headerDomains("Riverbend | Staff | https://jobs.ashbyhq.com/riverbend")).toEqual([]);
  });
});

describe("linkAgrees", () => {
  it("doubts a post linked by name to a company whose domain the post's header contradicts", () => {
    expect(linkAgrees("Streamline | Video | https://streamline.test\nmore", "streamline.claims")).toBe(false);
    expect(linkAgrees("Streamline | Video | https://streamline.test", "streamline.test")).toBe(true);
    expect(linkAgrees("Streamline | Video | https://jobs.streamline.test", "streamline.test")).toBe(true);
  });
  it("trusts the link when either side has no domain to compare", () => {
    expect(linkAgrees("Streamline | Video | Remote", "streamline.claims")).toBe(true);
    expect(linkAgrees("Streamline | Video | https://streamline.test", null)).toBe(true);
  });
});

describe("peopleFromHnPost on the fixture posts", () => {
  it("puts the stated name and role on the address that carries the name", () => {
    expect(run("p3")).toEqual([{ email: "ravi.patel@scrapwise.test", name: "Ravi", role: "co-founder/CTO" }]);
  });
  it("keeps an address written after 'me' on the company's domain, with no name when none was given", () => {
    expect(run("p2")).toEqual([{ email: "olle.berg@tandemcare.test", name: null, role: null }]);
    expect(run("p9")).toEqual([{ email: "lena@kestrelworks.test", name: null, role: null }]);
  });
  it("takes the company's domain from the post's first line when the company row has none", () => {
    expect(run("p4")).toEqual([{ email: "dmitri@fernhill.test", name: null, role: null }]);
    expect(run("p8")).toEqual([{ email: "hiring@harborline.test", name: null, role: null }]);
  });
  it("puts the stated role on the address written right after 'me'", () => {
    expect(run("p10")).toEqual([{ email: "marta.k@streamline.test", name: null, role: "runs the Video team" }]);
  });
  it("keeps a team inbox without the poster's name or role", () => {
    expect(run("p1")).toEqual([{ email: "jobs@brightleaf.test", name: null, role: null }]);
    expect(run("p11")).toEqual([{ email: "jobs@grokbox.test", name: null, role: null }]);
  });
  it("drops an address on another domain that is not written after 'me'", () => {
    expect(run("p5")).toEqual([]);
  });
  it("returns nothing when the post gives no address, whatever the introduction says", () => {
    expect(run("p6")).toEqual([]);
    expect(run("p7")).toEqual([]);
  });
});

describe("whose address it is", () => {
  it("does not give the poster's role to a colleague's address", () => {
    const text = "Acme | Engineer | acme.test\nI'm Nathan, CTO. Questions go to our recruiter Sarah: sarah@acme.test";
    expect(peopleFromHnPost(text, null)).toEqual([{ email: "sarah@acme.test", name: null, role: null }]);
  });
  it("drops a friend's address at another company", () => {
    const text = "Acme | Engineer | acme.test\nI'm Dana, CTO. My friend bob@other.test at Beta is hiring too; write to dana@acme.test";
    expect(peopleFromHnPost(text, null)).toEqual([{ email: "dana@acme.test", name: "Dana", role: "CTO" }]);
  });
  it("keeps a personal address on another domain when it follows 'me'", () => {
    expect(peopleFromHnPost("Acme | Engineer\nI'm Dana, CTO. Email me at dana.r@quillmail.test", "acme.test"))
      .toEqual([{ email: "dana.r@quillmail.test", name: "Dana", role: "CTO" }]);
  });
  it("accepts a subdomain of the company's domain", () => {
    expect(peopleFromHnPost("write to jobs@mail.acme.test", "acme.test")).toEqual([{ email: "jobs@mail.acme.test", name: null, role: null }]);
  });
  it("does not take a capitalised word after I'm for a name", () => {
    expect(peopleFromHnPost("I'm Hiring engineers. Write to me at a.b@acme.test", "acme.test")).toEqual([{ email: "a.b@acme.test", name: null, role: null }]);
  });
});

describe("the address pattern", () => {
  it("stops at the end of the address when a sentence follows without a space", () => {
    expect(peopleFromHnPost("Apply at jobs@acme.test.Thanks for reading", "acme.test")).toEqual([{ email: "jobs@acme.test", name: null, role: null }]);
  });
  it("ignores credentials inside a link, git remotes and no-reply addresses", () => {
    expect(peopleFromHnPost("Docs: https://user:pw@acme.test/x and ftp://pw@acme.test", "acme.test")).toEqual([]);
    expect(peopleFromHnPost("clone git@acme.test:repo.git, mail noreply@acme.test", "acme.test")).toEqual([]);
  });
  it("drops placeholder addresses, repeats and anything that is not text", () => {
    expect(peopleFromHnPost("send to you@example.com or name@company.com; ann@acme.test, ANN@acme.test.", "acme.test"))
      .toEqual([{ email: "ann@acme.test", name: null, role: null }]);
    expect(peopleFromHnPost(null, "acme.test")).toEqual([]);
    expect(peopleFromHnPost(42, null)).toEqual([]);
    expect(peopleFromHnPost("", null)).toEqual([]);
  });
  it("does not take the tail of an over-long local part for an address", () => {
    expect(peopleFromHnPost(`${"a".repeat(100)}@acme.test`, "acme.test")).toEqual([]);
  });
  it("keeps the role inside the table's limit", () => {
    const [p] = peopleFromHnPost(`I'm Ann, VP of ${"Product".padEnd(400, "x")}. ann@acme.test`, "acme.test");
    expect(p.role!.length).toBeLessThanOrEqual(100);
  });
});

describe("work stays bounded on crafted input", () => {
  const crafted = [
    "a".repeat(20000),
    "a.".repeat(10000),
    "a@".repeat(10000),
    "a@b.".repeat(5000),
    "x at y dot ".repeat(2000),
    "email: x at y dot ".repeat(1100),
    "[at]".repeat(5000),
    `I'm ${"A".repeat(20000)}`,
    " me".repeat(6600) + "a@acme.test",
  ];
  it("reads each 20,000-character post in well under the budget", () => {
    for (const text of crafted) {
      const t0 = performance.now();
      peopleFromHnPost(text, "acme.test");
      expect(performance.now() - t0).toBeLessThan(100);
    }
  });
});
