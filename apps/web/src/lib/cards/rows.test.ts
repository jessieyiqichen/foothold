import { describe, expect, it } from "vitest";
import { MAX_ROLES_ON_CARD } from "./constants";
import { readCards, readSavedCards, rowToCard } from "./rows";
import { row } from "./testRow";

describe("rowToCard: a row from fh_today is checked before it is shown", () => {
  it("reads a well-formed row", () => {
    const card = rowToCard(row);
    expect(card).toMatchObject({
      companyId: 812, name: "Acme AI", oneLiner: "Agents for hospital billing", website: "https://acme.ai", teamSize: 38,
      batch: "W24", stage: "Series A", investors: ["Accel", "Y Combinator"], lastPostedAt: "2026-10-24T10:00:00Z", recentRoles: 6,
      shared: ["product management", "sql"], score: 8.5,
    });
    expect(card?.roles.map((r) => r.id)).toEqual(["41", "42"]);
    expect(card?.roles[0]).toMatchObject({ title: "Associate Product Manager", family: "product", level: "entry", postedAt: "2026-10-24T10:00:00Z" });
    expect(card?.person).toEqual({
      name: "Dana Lee", role: "Founder", contactKind: "email", contact: "dana@acme.ai", href: "mailto:dana@acme.ai", source: "hn",
      sourceUrl: "https://news.ycombinator.com/item?id=4242", seenAt: "2026-11-12T08:00:00Z",
    });
  });

  it("reads missing facts as unknown rather than dropping the company", () => {
    const card = rowToCard({ ...row, one_liner: null, website: null, team_size: null, batch: null, stage: null, investors: null, last_posted_at: null, recent_roles: null, person: null });
    expect(card).toMatchObject({ oneLiner: null, website: null, teamSize: null, batch: null, stage: null, investors: [], lastPostedAt: null, recentRoles: null, person: null });
  });

  it("accepts a company id sent as text, as Postgres sends a bigint through some clients", () => {
    expect(rowToCard({ ...row, company_id: "812" })?.companyId).toBe(812);
  });

  it("keeps a company whose score is null, as a saved company whose roles closed can have, and reads it as 0", () => {
    expect(rowToCard({ ...row, score: null })?.score).toBe(0);
  });

  it("keeps a role with no family, as one the daily refresh wrote before labelling it", () => {
    expect(rowToCard({ ...row, roles: [{ ...row.roles[0], family: null }] })?.roles[0]).toMatchObject({ id: "41", family: null });
  });

  it("keeps a role with no title and no date, as a Hacker News post can be, and the company with it", () => {
    const card = rowToCard({ ...row, roles: [{ ...row.roles[0], title: null, posted_at: null }] });
    expect(card?.roles[0]).toMatchObject({ id: "41", title: null, postedAt: null });
    expect(rowToCard({ ...row, roles: [{ ...row.roles[0], title: "   " }] })?.roles[0].title).toBeNull();
  });

  it("drops a row with no usable id or name, or mistyped lists", () => {
    for (const bad of [null, "x", { ...row, company_id: null }, { ...row, company_id: "abc" }, { ...row, company_id: 1.5 }, { ...row, name: "" },
      { ...row, shared: "sql" }, { ...row, roles: null }, { ...row, score: "8" }, { ...row, team_size: "38" }, { ...row, investors: ["Accel", 3] }]) {
      expect(rowToCard(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it("never keeps a link that is not https: the website goes, a role goes, a source link goes", () => {
    const card = rowToCard({
      ...row, website: "http://acme.ai",
      roles: [{ ...row.roles[0], url: "javascript:alert(1)" }, row.roles[1]],
      person: { ...row.person, source_url: "http://news.ycombinator.com/item?id=4242" },
    });
    expect(card?.website).toBeNull();
    expect(card?.roles.map((r) => r.id)).toEqual(["42"]);
    expect(card?.person?.sourceUrl).toBeNull();
  });

  it("opens mail only for an email contact that looks like an address", () => {
    expect(rowToCard({ ...row, person: { ...row.person, contact: "not an address" } })?.person).toBeNull();
    expect(rowToCard({ ...row, person: { ...row.person, contact: "dana@acme.ai?cc=everyone@x.com" } })?.person).toBeNull();
  });

  it("links a url contact only when it is https, and never as mail", () => {
    const url = { ...row.person, contact_kind: "url", contact: "https://acme.ai/team" };
    expect(rowToCard({ ...row, person: url })?.person).toMatchObject({ contactKind: "url", href: "https://acme.ai/team" });
    expect(rowToCard({ ...row, person: { ...url, contact: "mailto:dana@acme.ai" } })?.person).toBeNull();
    expect(rowToCard({ ...row, person: { ...url, contact: "http://acme.ai/team" } })?.person).toBeNull();
  });

  it("leaves out a person whose source or date is missing: the source and date are always shown", () => {
    expect(rowToCard({ ...row, person: { ...row.person, source: "linkedin" } })?.person).toBeNull();
    expect(rowToCard({ ...row, person: { ...row.person, seen_at: null } })?.person).toBeNull();
  });

  it("keeps a person with no name, as most Hacker News posters give none: the source and date still say where they came from", () => {
    for (const name of [null, "", "  ", undefined]) {
      expect(rowToCard({ ...row, person: { ...row.person, name } })?.person, String(name)).toMatchObject({ name: null, href: "mailto:dana@acme.ai", source: "hn" });
    }
  });

  it("keeps at most two roles, in the order given", () => {
    const roles = [1, 2, 3].map((id) => ({ ...row.roles[0], id }));
    expect(MAX_ROLES_ON_CARD).toBe(2);
    expect(rowToCard({ ...row, roles })?.roles.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("reads a role family or level this page does not know as Other and not stated", () => {
    expect(rowToCard({ ...row, roles: [{ ...row.roles[0], family: "astronaut", level: "wizard" }] })?.roles[0]).toMatchObject({ family: "other", level: "unspecified" });
  });
});

describe("readCards", () => {
  it("keeps readable rows in order and counts the dropped", () => {
    expect(readCards([row, { ...row, name: "" }, { ...row, company_id: 9 }])).toMatchObject({ dropped: 1 });
    expect(readCards([row, { ...row, company_id: 9 }])?.cards.map((c) => c.companyId)).toEqual([812, 9]);
  });

  it("drops a company shown twice", () => {
    expect(readCards([row, row])?.cards).toHaveLength(1);
  });

  it("is null when the answer is not a list", () => {
    expect(readCards(null)).toBeNull();
    expect(readCards({})).toBeNull();
  });
});

describe("readSavedCards: fh_saved adds the decision", () => {
  it("reads saved and reached-out companies, newest first, and leaves out skipped ones", () => {
    const page = readSavedCards([
      { ...row, company_id: 1, decision: "saved", decided_at: "2026-11-12T10:00:00Z" },
      { ...row, company_id: 2, decision: "reached_out", decided_at: "2026-11-14T10:00:00Z" },
      { ...row, company_id: 3, decision: "skipped", decided_at: "2026-11-14T11:00:00Z" },
    ]);
    expect(page?.cards.map((c) => [c.companyId, c.decision])).toEqual([[2, "reached_out"], [1, "saved"]]);
  });

  it("drops a row with no known decision or date", () => {
    expect(readSavedCards([{ ...row, decision: "maybe", decided_at: "2026-11-12T10:00:00Z" }, { ...row, decision: "saved", decided_at: "later" }])).toEqual({ cards: [], dropped: 2 });
  });
});
