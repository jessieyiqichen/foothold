// HN "Who is hiring" posts that no company row knows: which company each one is, whether Foothold already has it
// (same domain), and which rows to create (user, 2026-11-14: a card needs a company to hang a person on).
// Precision over coverage (lead, after review): a post counts only when its first line names a domain that is the
// company's name itself ("acme.com", "getacme.com", "acmehq.com"). Every other post stays unlinked, which is
// harmless; a wrong link would put a stranger's address on a real company's card.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

import { headerDomains } from "./people.ts";

export interface HnPost { id: number; companyName: string; text: string; url: string }
export interface ExistingCompany { id: number; name: string; domain: string | null; source: string }
export interface NewCompany { sourceId: string; name: string; domain: string; website: string; sourceUrl: string }
export interface HnCompanyPlan {
  /** Posts to link to a company row that already exists. */
  link: { postingId: number; companyId: number }[];
  /** Rows to create, one a company: source 'hn', source_id "domain:<its domain>". */
  create: NewCompany[];
  /** Posts to link to a created row, by its source_id. */
  linkToNew: { postingId: number; sourceId: string }[];
}

/** fh_companies.source_id and .name allow 200 characters, which Postgres counts in code points. */
export const SOURCE_ID_MAX = 200;
const NAME_MAX = 200;
/** Two-label endings under which a company registers a third label ("acme.co.uk"). */
const SECOND_LEVEL = new Set(["co.uk", "org.uk", "ac.uk", "com.au", "co.jp", "com.br", "co.in", "co.nz", "co.il", "com.sg", "co.za", "com.mx", "co.ke"]);
/** The only additions a company's domain may have around its name. */
const NAME_IN_DOMAIN = (name: string) => new RegExp(`^(?:get|try|use|with|join)?${name}(?:hq|app|labs|ai)?$`);
/** Names that say no company. */
const GENERIC = new Set(["stealth", "stealth startup", "stealth mode", "stealth company", "unnamed", "confidential", "undisclosed"]);

const codePoints = (s: string, max: number) => [...s].slice(0, max).join("");

/** "jobs.acme.com" -> "acme.com"; "careers.acme.co.uk" -> "acme.co.uk". */
export function registrable(host: string): string {
  const labels = host.toLowerCase().replace(/^www\./, "").split(".");
  const keep = labels.length >= 3 && SECOND_LEVEL.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

/** "Clad (YC W23)" -> "Clad": the bracket after a name is a batch or an aside, never part of the name. */
const cleanName = (raw: string) => codePoints(raw.replace(/\s*\([^)]{0,80}\)\s*$/, "").trim(), NAME_MAX);

/** The company a post is about: its cleaned name, and its own domain if the header names one (else null). */
export function companyOfPost(p: HnPost): { name: string; domain: string | null } | null {
  const name = cleanName(typeof p.companyName === "string" ? p.companyName : "");
  if (!name || GENERIC.has(name.toLowerCase()) || !/^https:\/\/\S+$/.test(p.url)) return null;
  const squashed = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const own = squashed.length >= 2 ? NAME_IN_DOMAIN(squashed) : null;
  const domain = own ? headerDomains(p.text).map(registrable).find((d) => own.test(d.split(".")[0])) ?? null : null;
  return { name, domain };
}

/**
 * Which posts link to an existing company (same domain, the YC row first) and which companies to create. A company
 * is created only for a post with its own domain, and never under a name a company Foothold already has carries
 * (case-insensitive), so "Stripe | stripe-careers.com" can never become a second Stripe.
 */
export function planHnCompanies(posts: HnPost[], existing: ExistingCompany[]): HnCompanyPlan {
  const byDomain = new Map<string, ExistingCompany>();
  const names = new Set<string>();
  for (const c of existing) {
    names.add(c.name.toLowerCase());
    if (!c.domain) continue;
    const key = registrable(c.domain);
    const held = byDomain.get(key);
    if (!held || (c.source === "yc" && held.source !== "yc") || (c.source === held.source && c.id < held.id)) byDomain.set(key, c);
  }
  const plan: HnCompanyPlan = { link: [], create: [], linkToNew: [] };
  const created = new Set<string>();
  for (const p of posts) {
    const co = companyOfPost(p);
    if (!co?.domain) continue;
    const found = byDomain.get(co.domain);
    if (found) {
      plan.link.push({ postingId: p.id, companyId: found.id });
      continue;
    }
    if (names.has(co.name.toLowerCase())) continue;
    const sourceId = codePoints(`domain:${co.domain}`, SOURCE_ID_MAX);
    if (!created.has(sourceId)) {
      created.add(sourceId);
      plan.create.push({ sourceId, name: co.name, domain: co.domain, website: `https://${co.domain}`, sourceUrl: p.url });
    }
    plan.linkToNew.push({ postingId: p.id, sourceId });
  }
  return plan;
}

/** Whether any post could lead to a link or a row: the worker reads the company list only when one can. */
export const anyCandidate = (posts: HnPost[]): boolean => posts.some((p) => companyOfPost(p)?.domain);
