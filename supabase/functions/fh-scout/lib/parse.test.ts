import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { domainOf, htmlToText, parseHeader, parseHnThread, parseYcCompanies } from "./parse";

// Real rows saved 2026-11-10: three YC companies (two hiring, one acquired) and three HN comments from the
// November 2026 "Who is hiring" thread (one with "junior welcome", one with an email, one with "new grads").
const json = (name: string) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));

describe("parseYcCompanies", () => {
  const rows = parseYcCompanies(json("yc-sample.json"));

  it("keeps Active companies and drops acquired ones", () => {
    expect(rows.map((r) => r.name)).toEqual(["CircuitHub", "Rescale"]);
    expect(rows.every((r) => r.status === "Active")).toBe(true);
  });

  it("reads the fields a card needs and the domain for merging", () => {
    const [circuithub] = rows;
    expect(circuithub).toMatchObject({ source: "yc", sourceId: expect.any(String), isHiring: true, batch: "Winter 2012", teamSize: 58 });
    expect(circuithub.domain).toBe("circuithub.com");
    expect(circuithub.sourceUrl).toMatch(/^https:\/\/www\.ycombinator\.com\/companies\//);
    expect(circuithub.tags.length).toBeGreaterThan(0);
  });

  it("drops rows that are not objects or have no name or id", () => {
    expect(parseYcCompanies([null, 3, { name: "x", status: "Active" }, { id: 1, status: "Active" }])).toEqual([]);
    expect(parseYcCompanies("nope")).toEqual([]);
  });
});

describe("domainOf", () => {
  it("strips www and the path, lowercases, and refuses junk", () => {
    expect(domainOf("https://www.Example.com/about?x=1")).toBe("example.com");
    expect(domainOf("http://sub.example.org")).toBe("sub.example.org");
    expect(domainOf("localhost")).toBeNull();
    expect(domainOf(null)).toBeNull();
  });
});

describe("htmlToText", () => {
  it("turns paragraphs into lines, strips tags, decodes entities", () => {
    expect(htmlToText('A &amp; B<p>See <a href="https://x.io">x.io</a> &#x27;now&#x27;')).toBe("A & B\nSee x.io 'now'");
  });
});

describe("parseHeader", () => {
  it("splits Company | Role | Place", () => {
    expect(parseHeader("Acme | Data Analyst | NYC | Full-time\nWe build...")).toEqual({
      companyName: "Acme", title: "Data Analyst", location: "NYC | Full-time",
    });
  });
  it("falls back to 'Company is hiring', 'Company - …' and 'Company (batch) - …' first lines", () => {
    expect(parseHeader("DuckDuckGo - we are looking for candidates")).toMatchObject({ companyName: "DuckDuckGo", title: null });
    expect(parseHeader("Duranta ( https://getduranta.com/ ) is hiring a computer vision engineer")).toMatchObject({ companyName: "Duranta" });
    expect(parseHeader("telli (YF F24) - customer-facing agents - is hiring in Berlin")).toMatchObject({ companyName: "telli" });
    expect(parseHeader("Rapiscan Systems and its parent company OSI are hiring for service techs.")).toMatchObject({ companyName: "Rapiscan Systems and its parent company OSI" });
  });
  it("is null when the first line is not a header", () => {
    expect(parseHeader("Just a reply saying thanks")).toBeNull();
    expect(parseHeader("Apply here: https://tally.so/r/x")).toBeNull();
    expect(parseHeader("Location: Huntington Beach, CA, USA")).toBeNull();
    expect(parseHeader("India")).toBeNull();
    expect(parseHeader("We are hiring for several roles at StudyTurtle")).toBeNull();
  });
});

describe("parseHnThread", () => {
  const thread = json("hn-thread-sample.json");
  const postings = parseHnThread(thread);

  it("makes one posting per comment, linked to the thread", () => {
    expect(postings).toHaveLength(3);
    expect(postings.every((p) => p.threadId === String(thread.id) && p.source === "hn")).toBe(true);
    expect(postings[0].url).toBe(`https://news.ycombinator.com/item?id=${thread.children[0].id}`);
  });

  it("reads the company from the header and the emails from the text", () => {
    const voluntas = postings.find((p) => p.companyName === "Voluntas");
    expect(voluntas).toMatchObject({ title: "Remote", emails: ["jobs@voluntas.io"], author: "thechairman12" });
    const diffusion = postings.find((p) => p.companyName === "Diffusion");
    expect(diffusion?.emails).toEqual(["hello@diffusion.io"]);
    expect(diffusion?.text).toContain("including new grads");
  });

  it("keeps the links out of the html and the posting time", () => {
    const charly = postings.find((p) => p.companyName === "Charly");
    expect(charly?.links).toEqual(["https://hallocharly.de/en/careers/account-executive-govtech"]);
    expect(charly?.postedAt).toMatch(/^2026-11-/);
  });

  it("returns nothing for a thread without children or with junk children", () => {
    expect(parseHnThread({ id: 1 })).toEqual([]);
    expect(parseHnThread({ id: 1, children: [null, { id: 2 }, { id: 3, text: "no header here" }] })).toEqual([]);
  });
});
