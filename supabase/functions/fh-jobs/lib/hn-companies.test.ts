import { describe, expect, it } from "vitest";
import { anyCandidate, companyOfPost, planHnCompanies, registrable, SOURCE_ID_MAX } from "./hn-companies";

// Posts in the shape fh_postings stores them; companies and domains are made up (.test is reserved), except where a
// case is about a real company's domain being taken for someone else's (the reviewer's probes).
const post = (id: number, companyName: string, header: string) =>
  ({ id, companyName, text: `${header}\nWe build things.`, url: `https://news.ycombinator.com/item?id=${id}` });
const existing = [
  { id: 10, name: "Acme", domain: "acme.test", source: "vc" },
  { id: 11, name: "Acme", domain: "acme.test", source: "yc" },
  { id: 12, name: "Beta", domain: "beta.test", source: "yc" },
  { id: 13, name: "Stripe", domain: "stripe.com", source: "yc" },
  { id: 14, name: "Nameless", domain: null, source: "vc" },
];

describe("registrable", () => {
  it("keeps the part of a host a company registers", () => {
    expect(registrable("jobs.acme.test")).toBe("acme.test");
    expect(registrable("acme.test")).toBe("acme.test");
    expect(registrable("careers.acme.co.uk")).toBe("acme.co.uk");
    expect(registrable("acme.com.au")).toBe("acme.com.au");
  });
});

describe("companyOfPost: the domain must be the cleaned name itself", () => {
  it("accepts the name, or the name with a fixed prefix or suffix", () => {
    expect(companyOfPost(post(1, "Acme", "Acme | Engineer | NYC | https://www.acme.test/careers"))).toEqual({ name: "Acme", domain: "acme.test" });
    expect(companyOfPost(post(1, "Stream", "Stream | Video | https://getstream.test"))).toMatchObject({ domain: "getstream.test" });
    expect(companyOfPost(post(1, "Clad (YC W23)", "Clad (YC W23) | Engineer | withclad.test"))).toEqual({ name: "Clad", domain: "withclad.test" });
    expect(companyOfPost(post(1, "Tandem Health", "Tandem Health | PM | tandemhealth.test"))).toMatchObject({ domain: "tandemhealth.test" });
    expect(companyOfPost(post(1, "Kaida", "Kaida | Engineer | kaidahq.test"))).toMatchObject({ domain: "kaidahq.test" });
    expect(companyOfPost(post(1, "Acme Robotics", "Acme Robotics | Engineer | jobs.acmerobotics.test"))).toMatchObject({ domain: "acmerobotics.test" });
  });
  it("rejects a real company's domain that only contains a word of the name, or the other way round", () => {
    for (const [name, header] of [
      ["Open Climate", "Open Climate | ML Engineer | openai.com"],
      ["Box Robotics", "Box Robotics | Engineer | dropbox.com"],
      ["Quill (acquired by Stripe)", "Quill (acquired by Stripe) | Engineer | stripe.com"],
      ["Data Corp", "Data Corp | Analyst | databricks.com"],
      ["Superhuman Health", "Superhuman Health | Engineer | human.com"],
    ]) {
      expect(companyOfPost(post(1, name, header))).toMatchObject({ domain: null });
    }
  });
  it("gives no domain for a hosted page or a domain someone else owns", () => {
    for (const host of ["acme.github.io", "acme.vercel.app", "acme.notion.site", "acme.substack.com", "jobs.ashbyhq.com/acme", "workatastartup.com/acme"]) {
      expect(companyOfPost(post(1, "Acme", `Acme | Engineer | https://${host}`))).toMatchObject({ domain: null });
    }
    expect(companyOfPost(post(1, "Quill Labs", "Quill Labs | Engineer | backed by bigfund.test"))).toMatchObject({ domain: null });
  });
  it("drops a post with no usable name, or a generic one", () => {
    expect(companyOfPost({ id: 1, companyName: "  ", text: "x", url: "https://news.ycombinator.com/item?id=1" })).toBeNull();
    expect(companyOfPost({ id: 1, companyName: "Acme", text: "Acme | x", url: "http://bad" })).toBeNull();
    for (const name of ["Stealth", "Stealth Startup", "stealth startup (YC S24)", "Unnamed", "Confidential"]) {
      expect(companyOfPost(post(1, name, `${name} | Engineer | stealth.test`))).toBeNull();
    }
  });
});

describe("planHnCompanies", () => {
  it("links a post to the company that already has its domain, preferring the YC row", () => {
    const plan = planHnCompanies([post(1, "Acme", "Acme | Engineer | acme.test")], existing);
    expect(plan).toEqual({ link: [{ postingId: 1, companyId: 11 }], create: [], linkToNew: [] });
  });
  it("links through www. and subdomains", () => {
    expect(planHnCompanies([post(1, "Beta", "Beta | Engineer | https://www.careers.beta.test/jobs")], existing).link)
      .toEqual([{ postingId: 1, companyId: 12 }]);
  });
  it("creates one row for two posts from the same new company, keyed by its domain, and links both", () => {
    const plan = planHnCompanies([post(1, "Gamma", "Gamma | Backend | gamma.test"), post(2, "Gamma", "Gamma | Frontend | https://gamma.test")], existing);
    expect(plan.create).toEqual([{
      sourceId: "domain:gamma.test", name: "Gamma", domain: "gamma.test", website: "https://gamma.test",
      sourceUrl: "https://news.ycombinator.com/item?id=1",
    }]);
    expect(plan.linkToNew).toEqual([{ postingId: 1, sourceId: "domain:gamma.test" }, { postingId: 2, sourceId: "domain:gamma.test" }]);
  });
  it("creates nothing for a post whose header gives no domain of its own: it stays unlinked", () => {
    for (const header of ["Quill Labs | Engineer | Remote", "Quill Labs | Engineer | backed by acme.test"]) {
      expect(planHnCompanies([post(3, "Quill Labs", header)], existing)).toEqual({ link: [], create: [], linkToNew: [] });
    }
  });
  it("never creates a row named like a company Foothold already has", () => {
    expect(planHnCompanies([post(5, "STRIPE", "STRIPE | Engineer | stripe-careers.test")], existing))
      .toEqual({ link: [], create: [], linkToNew: [] });
    expect(planHnCompanies([post(5, "Stripe", "Stripe | Engineer | stripe.test")], existing).create).toEqual([]);
  });
  it("keeps the key and the name within the columns' 200 characters, counted in code points as Postgres does", () => {
    const longName = `Gamma${" 😀".repeat(150)}`;
    // The stored company name is long; the header the domain is read from is the usual short line.
    const plan = planHnCompanies([post(6, longName, "Gamma | Engineer | gamma.test")], existing);
    expect(plan.create).toHaveLength(1);
    const [c] = plan.create;
    expect([...c.sourceId].length).toBeLessThanOrEqual(SOURCE_ID_MAX);
    expect([...c.name].length).toBeLessThanOrEqual(200);
    expect(c.name).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });
  it("leaves its inputs untouched", () => {
    const rows = existing.map((r) => ({ ...r }));
    planHnCompanies([post(1, "Acme", "Acme | Engineer | acme.test")], rows);
    expect(rows).toEqual(existing);
  });
});

describe("anyCandidate", () => {
  it("is true only when some post names a domain of its own", () => {
    expect(anyCandidate([post(1, "Quill Labs", "Quill Labs | Engineer | Remote")])).toBe(false);
    expect(anyCandidate([post(1, "Quill Labs", "Quill Labs | Engineer | Remote"), post(2, "Gamma", "Gamma | x | gamma.test")])).toBe(true);
    expect(anyCandidate([])).toBe(false);
  });
});
