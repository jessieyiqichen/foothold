import { describe, expect, it } from "vitest";
import { companyOfPost, planHnCompanies, registrable } from "./hn-companies";

// Posts in the shape fh_postings stores them; every company and domain is made up (.test is reserved).
const post = (id: number, companyName: string, header: string) =>
  ({ id, companyName, text: `${header}\nWe build things.`, url: `https://news.ycombinator.com/item?id=${id}` });
const existing = [
  { id: 10, domain: "acme.test", source: "vc" },
  { id: 11, domain: "acme.test", source: "yc" },
  { id: 12, domain: "beta.test", source: "yc" },
  { id: 13, domain: null, source: "vc" },
];

describe("registrable", () => {
  it("keeps the part of a host a company registers", () => {
    expect(registrable("jobs.acme.test")).toBe("acme.test");
    expect(registrable("acme.test")).toBe("acme.test");
    expect(registrable("careers.acme.co.uk")).toBe("acme.co.uk");
    expect(registrable("acme.com.au")).toBe("acme.com.au");
  });
});

describe("companyOfPost", () => {
  it("reads the name from the header and the domain the header names", () => {
    expect(companyOfPost(post(1, "Acme", "Acme | Engineer | NYC | https://www.acme.test/careers")))
      .toEqual({ name: "Acme", domain: "acme.test", sourceId: "acme.test" });
  });
  it("takes a subdomain back to the company's domain", () => {
    expect(companyOfPost(post(1, "Acme Robotics", "Acme Robotics | Engineer | jobs.acmerobotics.test")))
      .toMatchObject({ domain: "acmerobotics.test" });
  });
  it("uses the lower-cased name when the header names no domain", () => {
    expect(companyOfPost(post(1, "Quill Labs", "Quill Labs | Engineer | Remote")))
      .toEqual({ name: "Quill Labs", domain: null, sourceId: "quill labs" });
  });
  it("does not take a domain that belongs to someone else named in the header", () => {
    expect(companyOfPost(post(1, "Quill Labs", "Quill Labs | Engineer | backed by bigfund.test")))
      .toEqual({ name: "Quill Labs", domain: null, sourceId: "quill labs" });
    expect(companyOfPost(post(1, "Quill Labs", "Quill Labs | Engineer | https://jobs.ashbyhq.com/quill"))).toMatchObject({ domain: null });
  });
  it("accepts a domain built from the name with a common prefix or suffix", () => {
    expect(companyOfPost(post(1, "Stream", "Stream | Video | https://getstream.test"))).toMatchObject({ domain: "getstream.test" });
    expect(companyOfPost(post(1, "Clad (YC W23)", "Clad (YC W23) | Engineer | withclad.test"))).toMatchObject({ name: "Clad", domain: "withclad.test" });
    expect(companyOfPost(post(1, "Tandem Health", "Tandem Health | PM | tandemhealth.test"))).toMatchObject({ domain: "tandemhealth.test" });
  });
  it("drops a post with no usable name", () => {
    expect(companyOfPost({ id: 1, companyName: "  ", text: "x", url: "https://news.ycombinator.com/item?id=1" })).toBeNull();
    expect(companyOfPost({ id: 1, companyName: "Acme", text: "Acme | x", url: "http://bad" })).toBeNull();
  });
});

describe("planHnCompanies", () => {
  it("links a post to the company that already has its domain, preferring the YC row", () => {
    const plan = planHnCompanies([post(1, "Acme", "Acme | Engineer | acme.test")], existing);
    expect(plan).toEqual({ link: [{ postingId: 1, companyId: 11 }], create: [], linkToNew: [] });
  });
  it("links through www. and subdomains on either side", () => {
    const plan = planHnCompanies([post(1, "Beta", "Beta | Engineer | https://www.careers.beta.test/jobs")], existing);
    expect(plan.link).toEqual([{ postingId: 1, companyId: 12 }]);
  });
  it("creates one row for two posts from the same new company, and links both to it", () => {
    const plan = planHnCompanies([post(1, "Gamma", "Gamma | Backend | gamma.test"), post(2, "Gamma", "Gamma | Frontend | https://gamma.test")], existing);
    expect(plan.create).toEqual([{
      sourceId: "gamma.test", name: "Gamma", domain: "gamma.test", website: "https://gamma.test",
      sourceUrl: "https://news.ycombinator.com/item?id=1",
    }]);
    expect(plan.linkToNew).toEqual([{ postingId: 1, sourceId: "gamma.test" }, { postingId: 2, sourceId: "gamma.test" }]);
  });
  it("creates a row by name, with no domain or website, when the header names none", () => {
    const plan = planHnCompanies([post(3, "Quill Labs", "Quill Labs | Engineer | Remote")], existing);
    expect(plan.create).toEqual([{ sourceId: "quill labs", name: "Quill Labs", domain: null, website: null, sourceUrl: "https://news.ycombinator.com/item?id=3" }]);
  });
  it("never links by a domain the header gives for another company", () => {
    const plan = planHnCompanies([post(4, "Quill Labs", "Quill Labs | Engineer | backed by acme.test")], existing);
    expect(plan.link).toEqual([]);
    expect(plan.create.map((c) => c.sourceId)).toEqual(["quill labs"]);
  });
  it("leaves its inputs untouched", () => {
    const rows = existing.map((r) => ({ ...r }));
    planHnCompanies([post(1, "Acme", "Acme | Engineer | acme.test")], rows);
    expect(rows).toEqual(existing);
  });
});
