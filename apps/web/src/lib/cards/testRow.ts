/** One well-formed row as fh_today returns it, for the tests. */
export const row = {
  company_id: 812, name: "Acme AI", one_liner: "Agents for hospital billing", website: "https://acme.ai", team_size: 38,
  batch: "W24", stage: "Series A", investors: ["Accel", "Y Combinator"], last_posted_at: "2026-10-24T10:00:00Z", recent_roles: 6,
  shared: ["product management", "sql"], score: 8.5,
  roles: [
    { id: 41, title: "Associate Product Manager", url: "https://jobs.ashbyhq.com/acme/41", posted_at: "2026-10-24T10:00:00Z", family: "product", level: "entry", shared: ["sql"] },
    { id: 42, title: "Product Analyst", url: "https://jobs.ashbyhq.com/acme/42", posted_at: "2026-10-20T10:00:00Z", family: "data", level: "unspecified", shared: [] },
  ],
  person: {
    name: "Dana Lee", role: "Founder", contact_kind: "email", contact: "dana@acme.ai", source: "hn",
    source_url: "https://news.ycombinator.com/item?id=4242", seen_at: "2026-11-12T08:00:00Z",
  },
};
