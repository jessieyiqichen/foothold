// Turns the YC company list and a Hacker News "Who is hiring" thread into Company and Posting rows.
// Every value from outside is checked: a company with no id, name or website is dropped; a comment with no text,
// or no "Company | Role" header, is dropped. Nothing here calls the network.

import { type Company, LIMITS, type Posting } from "./types.ts";

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;
const strings = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, max)).filter((x): x is string => x !== null) : [];
const httpUrl = (v: unknown): string | null => {
  const s = str(v, LIMITS.url);
  if (!s || !/^https?:\/\/\S+$/i.test(s)) return null;
  try { new URL(s); return s; } catch { return null; }
};

/** "https://www.Example.com/about" -> "example.com"; null when there is no usable website. */
export function domainOf(website: string | null): string | null {
  if (!website) return null;
  try {
    const host = new URL(website).hostname.toLowerCase().replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch { return null; }
}

/** The YC directory JSON (github.com/yc-oss/api). Only companies YC still lists as Active are kept. */
export function parseYcCompanies(raw: unknown): Company[] {
  if (!Array.isArray(raw)) return [];
  const out: Company[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const r = c as Record<string, unknown>;
    const name = str(r.name, LIMITS.name);
    const id = Number.isInteger(r.id) ? String(r.id) : null;
    if (!name || !id || r.status !== "Active") continue;
    const website = httpUrl(r.website);
    out.push({
      source: "yc", sourceId: id, name,
      slug: str(r.slug, LIMITS.name), website, domain: domainOf(website),
      oneLiner: str(r.one_liner, LIMITS.oneLiner), description: str(r.long_description, LIMITS.description),
      tags: strings(r.tags, LIMITS.tag), industries: strings(r.industries, LIMITS.tag),
      locations: strings(r.all_locations, LIMITS.location),
      teamSize: typeof r.team_size === "number" && r.team_size >= 0 ? Math.floor(r.team_size) : null,
      batch: str(r.batch, 20), stage: str(r.stage, 40), status: "Active",
      isHiring: r.isHiring === true, sourceUrl: httpUrl(r.url),
    });
  }
  return out;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#x2F": "/", "#39": "'" };
/** HN comment HTML to plain text: paragraphs become line breaks, links keep their text, entities are decoded. */
export function htmlToText(html: string): string {
  return html
    .replace(/<p>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x27|#x2F|#39|amp|lt|gt|quot);/g, (_, e) => ENTITIES[e] ?? "")
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const HREF = /href="([^"]+)"/gi;
const decode = (s: string) => s.replace(/&(#x27|#x2F|#39|amp|lt|gt|quot);/g, (_, e) => ENTITIES[e] ?? "");

/** "Company | Role | Place | ..." on the first line -> the parts. Null when the first line has no "|". */
export function parseHeader(text: string): { companyName: string; title: string | null; location: string | null } | null {
  const first = text.split("\n")[0] ?? "";
  if (!first.includes("|")) return looseHeader(first);
  const parts = first.split("|").map((p) => p.trim()).filter(Boolean);
  const companyName = str(parts[0], LIMITS.name);
  if (!companyName) return null;
  return { companyName, title: str(parts[1], LIMITS.title), location: str(parts.slice(2).join(" | "), LIMITS.location) };
}

const LOOSE_NAME_MAX = 60;
/** A first line without "|": "DuckDuckGo - we are looking…", "Acme is hiring a…", "telli (YF F24) - …". The company
 *  is what comes before " is hiring", " - " or " (". Null when that part is empty, too long, or has no letter. */
function looseHeader(first: string): { companyName: string; title: null; location: null } | null {
  const cut = first.search(/\s+(is|are)\s+hiring\b|\s+[-\u2013\u2014]\s+|\s*\(/i);
  const name = str(cut > 0 ? first.slice(0, cut) : "", LIMITS.name);
  if (!name || name.length > LOOSE_NAME_MAX || !/[a-z]/i.test(name) || /^(apply|location|remote|we)\b/i.test(name)) return null;
  return { companyName: name, title: null, location: null };
}

/** One "Who is hiring" thread as the Algolia items API returns it: {id, title, children: [{id, author, text, created_at_i}]}. */
export function parseHnThread(raw: unknown): Posting[] {
  if (!raw || typeof raw !== "object") return [];
  const thread = raw as Record<string, unknown>;
  const threadId = Number.isInteger(thread.id) ? String(thread.id) : null;
  if (!threadId || !Array.isArray(thread.children)) return [];
  const out: Posting[] = [];
  for (const child of thread.children) {
    if (!child || typeof child !== "object") continue;
    const c = child as Record<string, unknown>;
    const id = Number.isInteger(c.id) ? String(c.id) : null;
    const html = typeof c.text === "string" ? c.text : "";
    const text = htmlToText(html).slice(0, LIMITS.text);
    if (!id || text.length === 0) continue;
    const header = parseHeader(text);
    if (!header) continue;
    const emails = [...new Set((text.match(EMAIL) ?? []).map((e) => e.toLowerCase()))];
    const links = [...new Set([...html.matchAll(HREF)].map((m) => httpUrl(decode(m[1]))).filter((u): u is string => u !== null))];
    out.push({
      source: "hn", sourceId: id, ...header, text,
      url: `https://news.ycombinator.com/item?id=${id}`, links, emails,
      author: str(c.author, 100), threadId,
      postedAt: typeof c.created_at_i === "number" ? new Date(c.created_at_i * 1000).toISOString() : null,
    });
  }
  return out;
}
