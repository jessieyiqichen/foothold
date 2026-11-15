// HN "Who is hiring" posts that no company row knows: which company each one is, whether Foothold already has it
// (same domain), and which rows to create (user, 2026-11-14: a card needs a company to hang a person on).
// The company name is the one fh-scout's header parser stored; the domain is read from the post's first line and kept
// only if it looks like that company's own (so "backed by bigfund.com" is not taken for the company's site).
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

import { headerDomains } from "./people.ts";

export interface HnPost { id: number; companyName: string; text: string; url: string }
export interface ExistingCompany { id: number; domain: string | null; source: string }
export interface NewCompany { sourceId: string; name: string; domain: string | null; website: string | null; sourceUrl: string }
export interface HnCompanyPlan {
  /** Posts to link to a company row that already exists. */
  link: { postingId: number; companyId: number }[];
  /** Rows to create, one a company (source 'hn', source_id the domain or the lower-cased name). */
  create: NewCompany[];
  /** Posts to link to a created row, by its source_id. */
  linkToNew: { postingId: number; sourceId: string }[];
}

const NAME_MAX = 200;
/** Two-label endings under which a company registers a third label ("acme.co.uk"). */
const SECOND_LEVEL = new Set(["co.uk", "org.uk", "ac.uk", "com.au", "co.jp", "com.br", "co.in", "co.nz", "co.il", "com.sg", "co.za", "com.mx", "co.ke"]);
/** Words in a company name that say nothing about which domain is its own. */
const GENERIC = new Set(["the", "and", "inc", "labs", "lab", "technologies", "technology", "tech", "group", "company", "corp", "app", "hq", "yc"]);

/** "jobs.acme.com" -> "acme.com"; "careers.acme.co.uk" -> "acme.co.uk". */
export function registrable(host: string): string {
  const labels = host.toLowerCase().replace(/^www\./, "").split(".");
  const keep = labels.length >= 3 && SECOND_LEVEL.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

/** "Clad (YC W23)" -> "Clad": the bracket after a name is a batch or an aside, not part of the name. */
const cleanName = (raw: string) => raw.replace(/\s*\([^)]{0,80}\)\s*$/, "").trim().slice(0, NAME_MAX);

/** Whether a domain looks like the company's own: its first label contains the name, or a distinctive word of it. */
function looksLike(name: string, raw: string, domain: string): boolean {
  const label = registrable(domain).split(".")[0];
  const squashed = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const words = raw.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !GENERIC.has(w));
  return (squashed.length >= 3 && (label.includes(squashed) || (label.length >= 3 && squashed.includes(label))))
    || words.some((w) => label.includes(w));
}

/** The company a post is about: its name, its own domain if the header names one, and the source_id of its row. */
export function companyOfPost(p: HnPost): { name: string; domain: string | null; sourceId: string } | null {
  const name = cleanName(typeof p.companyName === "string" ? p.companyName : "");
  if (!name || !/^https:\/\/\S+$/.test(p.url)) return null;
  const domain = headerDomains(p.text).map(registrable).find((d) => looksLike(name, p.companyName, d)) ?? null;
  return { name, domain, sourceId: domain ?? name.toLowerCase() };
}

/** Which posts link to an existing company (by domain, the YC row first) and which companies to create. */
export function planHnCompanies(posts: HnPost[], existing: ExistingCompany[]): HnCompanyPlan {
  const byDomain = new Map<string, ExistingCompany>();
  for (const c of existing) {
    if (!c.domain) continue;
    const key = registrable(c.domain);
    const held = byDomain.get(key);
    const better = !held || (c.source === "yc" && held.source !== "yc") || (c.source === held.source && c.id < held.id);
    if (better) byDomain.set(key, c);
  }
  const plan: HnCompanyPlan = { link: [], create: [], linkToNew: [] };
  const created = new Set<string>();
  for (const p of posts) {
    const co = companyOfPost(p);
    if (!co) continue;
    const found = co.domain ? byDomain.get(co.domain) : undefined;
    if (found) {
      plan.link.push({ postingId: p.id, companyId: found.id });
      continue;
    }
    if (!created.has(co.sourceId)) {
      created.add(co.sourceId);
      plan.create.push({ sourceId: co.sourceId, name: co.name, domain: co.domain, website: co.domain ? `https://${co.domain}` : null, sourceUrl: p.url });
    }
    plan.linkToNew.push({ postingId: p.id, sourceId: co.sourceId });
  }
  return plan;
}
