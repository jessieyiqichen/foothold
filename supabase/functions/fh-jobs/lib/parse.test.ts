import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  boardUrl, clean, parseAshby, parseGem, parseGetroCompanies, parseGreenhouse, parseLever, parseRippling, parseRipplingJob,
  parseWorkable, PARSERS, plain, ripplingJobUrl, slugCandidates, TEXT_MAX,
} from "./parse";

// Real responses saved 2026-11-10, cut to two or three rows each: Accel's Getro board, PostHog on Ashby,
// GiveDirectly on Greenhouse, Palantir on Lever. Saved 2026-11-11: Hugging Face on Workable, Rippling's own board
// (the list, and one job's detail) and Gem's own board (it had one open role).
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
  it("removes characters the database refuses, including half an emoji left by the cut", () => {
    expect(clean("a\u0000b")).toBe("ab");
    expect(clean("ok \uD83D")).toBe("ok ");
    expect(clean("fine \uD83D\uDE00")).toBe("fine \uD83D\uDE00");
    const [job] = parseAshby({ jobs: [{ id: "1", title: "A", jobUrl: "https://x.io/1", descriptionPlain: "x".repeat(TEXT_MAX - 1) + "\uD83D\uDE00" }] });
    expect(job.text).toHaveLength(TEXT_MAX - 1);
    expect(() => JSON.parse(JSON.stringify(job.text))).not.toThrow();
  });
  it("builds each board's public address", () => {
    expect(boardUrl("ashby", "acme")).toBe("https://api.ashbyhq.com/posting-api/job-board/acme");
    expect(boardUrl("greenhouse", "acme")).toContain("/boards/acme/jobs?content=true");
    expect(boardUrl("lever", "acme")).toBe("https://api.lever.co/v0/postings/acme?mode=json");
  });
});

describe("Workable, Rippling and Gem", () => {
  it("parses Workable: the shortcode is the id, the place is city, region and country", () => {
    const jobs = parseWorkable(json("workable.json"));
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ id: "81B46579FE", location: "Paris, Île-de-France, France" });
    expect(jobs[0].url).toBe("https://apply.workable.com/j/81B46579FE");
    expect(jobs[0].text).toMatch(/Hugging Face/);
    expect(jobs[0].text).not.toMatch(/<p>/);
    expect(jobs[0].postedAt).toMatch(/^2026-05-29T/);
  });
  it("says Remote for a Workable job with no place that allows remote work", () => {
    const [job] = parseWorkable({ jobs: [{ shortcode: "A1", title: "Engineer", url: "https://apply.workable.com/j/A1", telecommuting: true, city: "" }] });
    expect(job.location).toBe("Remote");
  });
  it("parses Rippling's list, which carries no description: the text is the title until the detail is read", () => {
    const jobs = parseRippling(json("rippling.json"));
    expect(jobs).toHaveLength(3);
    expect(jobs[0]).toMatchObject({ id: "ef0b7266-678c-4a23-a439-1a5e7362b604", title: "Account Executive, Broker Channel (Arkansas)", location: "AR" });
    expect(jobs[0].text).toBe(jobs[0].title);
    expect(jobs[0].url).toMatch(/^https:\/\/ats\.rippling\.com\/rippling\/jobs\//);
  });
  it("keeps one row for a Rippling job listed once per location", () => {
    const row = { uuid: "u1", name: "Engineer", url: "https://ats.rippling.com/acme/jobs/u1" };
    const jobs = parseRippling([{ ...row, workLocation: { label: "Austin, TX" } }, { ...row, workLocation: { label: "Remote" } }]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].location).toBe("Austin, TX; Remote");
  });
  it("reads a Rippling job's detail: the role first, then the company, as text, with the date", () => {
    const detail = parseRipplingJob(json("rippling-job.json"));
    expect(detail.text).toMatch(/Rippling/);
    expect(detail.text).not.toMatch(/<p|style=/);
    expect(detail.postedAt).toMatch(/^2026-10-06T/);
    expect(parseRipplingJob(null)).toEqual({ text: null, postedAt: null });
    expect(parseRipplingJob({ description: "not an object", createdOn: 5n })).toEqual({ text: null, postedAt: null });
    expect(parseRipplingJob({ description: { role: 7, company: null } })).toEqual({ text: null, postedAt: null });
  });
  it("parses Gem, taking its plain text", () => {
    const jobs = parseGem(json("gem.json"));
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ title: "Engineering Manager (AI Products)", location: "San Francisco, United States" });
    expect(jobs[0].url).toMatch(/^https:\/\/jobs\.gem\.com\/gem\//);
    expect(jobs[0].text).toMatch(/^Role Details/);
    expect(jobs[0].postedAt).toMatch(/^2026-03-05T/);
  });
  it("falls back to Gem's HTML when the plain text is missing", () => {
    const [job] = parseGem([{ id: "g1", title: "Analyst", absolute_url: "https://jobs.gem.com/acme/g1", content: "<p>Two &amp; three</p>" }]);
    expect(job.text).toBe("Two & three");
  });
  it("drops rows with no id, no title, no https link, a wrong type or null, and never throws on another shape", () => {
    const bad = [
      null, 7, "row", [],
      { title: "No id", url: "https://x.io/1", absolute_url: "https://x.io/1" },
      { shortcode: "A", uuid: "A", id: "A", url: "https://x.io/1", absolute_url: "https://x.io/1" },
      { shortcode: "B", uuid: "B", id: "B", title: "No link", name: "No link" },
      { shortcode: "C", uuid: "C", id: "C", title: "Not https", name: "Not https", url: "http://x.io/1", absolute_url: "http://x.io/1" },
      { shortcode: { a: 1 }, uuid: ["u"], id: { a: 1 }, title: 5, name: 5, url: 9, absolute_url: 9 },
    ];
    expect(parseWorkable({ jobs: bad })).toEqual([]);
    expect(parseRippling(bad)).toEqual([]);
    expect(parseGem(bad)).toEqual([]);
    for (const shape of [null, undefined, "Not Found", 404, {}, { jobs: "none" }, { error_code: "RESOURCE_NOT_FOUND" }]) {
      expect(parseWorkable(shape)).toEqual([]);
      expect(parseRippling(shape)).toEqual([]);
      expect(parseGem(shape)).toEqual([]);
    }
  });
  it("builds each new board's public address and has a parser for every system", () => {
    expect(boardUrl("workable", "acme")).toBe("https://apply.workable.com/api/v1/widget/accounts/acme?details=true");
    expect(boardUrl("rippling", "acme")).toBe("https://api.rippling.com/platform/api/ats/v1/board/acme/jobs");
    expect(boardUrl("gem", "acme")).toBe("https://api.gem.com/job_board/v0/acme/job_posts/");
    expect(ripplingJobUrl("acme", "u-1")).toBe("https://api.rippling.com/platform/api/ats/v1/board/acme/jobs/u-1");
    expect(Object.keys(PARSERS).sort()).toEqual(["ashby", "gem", "greenhouse", "lever", "rippling", "workable"]);
  });
});
