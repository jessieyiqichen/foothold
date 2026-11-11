import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { boardUrl, parseAshby, parseGetroCompanies, parseGreenhouse, parseLever, plain, slugCandidates, TEXT_MAX } from "./parse";

// Real responses saved 2026-11-10, cut to two or three rows each: Accel's Getro board, PostHog on Ashby,
// GiveDirectly on Greenhouse, Palantir on Lever.
const json = (name: string) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));

describe("parseGetroCompanies", () => {
  it("reads name, domain and whether the company has open jobs", () => {
    const rows = parseGetroCompanies(json("getro-companies.json"));
    expect(rows).toHaveLength(12); // Getro returns its own page size
    expect(rows[0]).toMatchObject({ name: "100ms", domain: "100ms.live", isHiring: true });
    expect(rows[0].oneLiner).toMatch(/live-video/);
  });
  it("drops companies with no name or no usable domain", () => {
    const raw = { results: { companies: [{ name: "x" }, { domain: "x.com" }, { name: "y", domain: "not a domain" }, null] } };
    expect(parseGetroCompanies(raw)).toEqual([]);
    expect(parseGetroCompanies({})).toEqual([]);
  });
});

describe("slugCandidates", () => {
  it("tries the slug, the domain's first label and the squashed name, without repeats", () => {
    expect(slugCandidates({ slug: "posthog", domain: "posthog.com", name: "PostHog" })).toEqual(["posthog"]);
    expect(slugCandidates({ slug: null, domain: "getstream.io", name: "Stream" })).toEqual(["getstream", "stream"]);
    expect(slugCandidates({ slug: null, domain: null, name: "Charge Robotics!" })).toEqual(["chargerobotics", "charge-robotics"]);
  });
});

describe("plain", () => {
  it("unescapes Greenhouse's escaped HTML, keeps line breaks, drops tags", () => {
    expect(plain("&lt;p&gt;Hi &amp;amp; bye&lt;/p&gt;&lt;ul&gt;&lt;li&gt;2+ years&lt;/li&gt;&lt;/ul&gt;")).toBe("Hi & bye\n2+ years");
    expect(plain("a&nbsp;b &#8217;c&#x27;")).toBe("a b ’c'");
  });
});

describe("the three job boards", () => {
  it("parses Ashby", () => {
    const jobs = parseAshby(json("ashby.json"));
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ id: expect.any(String), title: expect.any(String) });
    expect(jobs[0].url).toMatch(/^https:\/\/jobs\.ashbyhq\.com\/posthog\//i);
    expect(jobs[0].text.length).toBeGreaterThan(100);
    expect(jobs[0].postedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
  });
  it("parses Greenhouse and turns its escaped HTML into text", () => {
    const jobs = parseGreenhouse(json("greenhouse.json"));
    expect(jobs).toHaveLength(2);
    expect(jobs[0].url).toMatch(/^https:\/\/job-boards\.greenhouse\.io\/givedirectly\//);
    expect(jobs[0].text).not.toMatch(/&lt;|<p>/);
    expect(jobs[0].location).toEqual(expect.any(String));
  });
  it("parses Lever, joining the description and its lists", () => {
    const jobs = parseLever(json("lever.json"));
    expect(jobs).toHaveLength(2);
    expect(jobs[0].url).toMatch(/^https:\/\/jobs\.lever\.co\/palantir\//);
    expect(jobs[0].text.length).toBeGreaterThan(100);
  });
  it("drops jobs with no id, title or https link, and unlisted Ashby jobs", () => {
    expect(parseAshby({ jobs: [{ id: "1", title: "A", jobUrl: "http://x" }, { title: "B", jobUrl: "https://x" }, { id: "2", title: "C", jobUrl: "https://x", isListed: false }] })).toEqual([]);
    expect(parseGreenhouse({ jobs: [null, { id: 1 }] })).toEqual([]);
    expect(parseLever({ not: "a list" })).toEqual([]);
  });
  it("falls back to the title when a job has no description, and cuts long text", () => {
    const [job] = parseAshby({ jobs: [{ id: "1", title: "Analyst", jobUrl: "https://x.io/1" }] });
    expect(job.text).toBe("Analyst");
    const [long] = parseAshby({ jobs: [{ id: "1", title: "A", jobUrl: "https://x.io/1", descriptionPlain: "x".repeat(TEXT_MAX + 50) }] });
    expect(long.text).toHaveLength(TEXT_MAX);
  });
  it("builds each board's public address", () => {
    expect(boardUrl("ashby", "acme")).toBe("https://api.ashbyhq.com/posting-api/job-board/acme");
    expect(boardUrl("greenhouse", "acme")).toContain("/boards/acme/jobs?content=true");
    expect(boardUrl("lever", "acme")).toBe("https://api.lever.co/v0/postings/acme?mode=json");
  });
});
