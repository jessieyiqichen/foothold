// Parsers for the jobs worker: a Getro board's company list (VC job boards), and the public job boards of
// Greenhouse, Ashby and Lever. Every value from outside is checked; a row missing what a posting needs is dropped.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

export type Ats = "ashby" | "greenhouse" | "lever";

export interface VcCompany {
  name: string;
  domain: string;
  oneLiner: string | null;
  teamSize: number | null;
  stage: string | null;
  tags: string[];
  isHiring: boolean;
}

export interface AtsJob {
  /** The job's id on its board. */
  id: string;
  title: string;
  location: string | null;
  /** Plain text of the description, cut to TEXT_MAX. */
  text: string;
  url: string;
  postedAt: string | null;
}

export const TEXT_MAX = 6000;
export const JOBS_PER_COMPANY_MAX = 300;
const NAME_MAX = 200;
const TITLE_MAX = 300;

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;
const httpsUrl = (v: unknown): string | null => {
  const s = str(v, 2000);
  return s && /^https:\/\/\S+$/i.test(s) ? s : null;
};
const isoDate = (v: unknown): string | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
/** HTML (possibly entity-escaped, as Greenhouse sends it) to plain text. */
export function plain(html: string): string {
  const decode = (s: string) =>
    s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] !== "#") return NAMED[e.toLowerCase()] ?? m;
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    });
  return decode(decode(html).replace(/<(\/p|\/li|\/h[1-6]|br\s*\/?|\/div)>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

/** A posting must have text; a job with no description falls back to its title. */
const body = (text: string | null, title: string) => (text && text.length > 0 ? text : title).slice(0, TEXT_MAX);

/** Getro's company search: {results: {companies: [{name, domain, description, head_count, stage, active_jobs_count}]}}. */
export function parseGetroCompanies(raw: unknown): VcCompany[] {
  const list = (raw as { results?: { companies?: unknown } })?.results?.companies;
  if (!Array.isArray(list)) return [];
  const out: VcCompany[] = [];
  for (const c of list) {
    if (!c || typeof c !== "object") continue;
    const r = c as Record<string, unknown>;
    const name = str(r.name, NAME_MAX);
    const domain = str(r.domain, 200)?.toLowerCase().replace(/^www\./, "") ?? null;
    if (!name || !domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) continue;
    out.push({
      name, domain,
      oneLiner: str(r.description, 1000),
      teamSize: typeof r.head_count === "number" && r.head_count >= 0 ? Math.floor(r.head_count) : null,
      stage: str(r.stage, 40),
      tags: Array.isArray(r.industry_tags) ? r.industry_tags.map((t) => str(t, 60)).filter((t): t is string => t !== null) : [],
      isHiring: typeof r.active_jobs_count === "number" && r.active_jobs_count > 0,
    });
  }
  return out;
}

/** Board names to try for a company: its slug, the first label of its domain, its name without punctuation. */
export function slugCandidates(c: { slug: string | null; domain: string | null; name: string }): string[] {
  const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const fromDomain = c.domain ? c.domain.split(".")[0] : "";
  const all = [c.slug ?? "", fromDomain, c.name.replace(/\s+/g, ""), c.name.replace(/\s+/g, "-")].map(squash);
  return [...new Set(all.filter((s) => s.length >= 2 && s.length <= 60))];
}

export const boardUrl = (ats: Ats, slug: string): string =>
  ats === "ashby" ? `https://api.ashbyhq.com/posting-api/job-board/${slug}`
  : ats === "greenhouse" ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
  : `https://api.lever.co/v0/postings/${slug}?mode=json`;

function push(out: AtsJob[], id: unknown, title: unknown, location: unknown, text: string | null, url: unknown, postedAt: unknown): void {
  const jobId = typeof id === "string" || typeof id === "number" ? String(id) : null;
  const t = str(title, TITLE_MAX);
  const u = httpsUrl(url);
  if (!jobId || !t || !u || out.length >= JOBS_PER_COMPANY_MAX) return;
  out.push({ id: jobId, title: t, location: str(location, 300), text: body(text, t), url: u, postedAt: isoDate(postedAt) });
}

export function parseAshby(raw: unknown): AtsJob[] {
  const jobs = (raw as { jobs?: unknown })?.jobs;
  if (!Array.isArray(jobs)) return [];
  const out: AtsJob[] = [];
  for (const j of jobs) {
    if (!j || typeof j !== "object") continue;
    const r = j as Record<string, unknown>;
    if (r.isListed === false) continue;
    push(out, r.id, r.title, r.location, str(r.descriptionPlain, TEXT_MAX), r.jobUrl, r.publishedAt);
  }
  return out;
}

export function parseGreenhouse(raw: unknown): AtsJob[] {
  const jobs = (raw as { jobs?: unknown })?.jobs;
  if (!Array.isArray(jobs)) return [];
  const out: AtsJob[] = [];
  for (const j of jobs) {
    if (!j || typeof j !== "object") continue;
    const r = j as Record<string, unknown>;
    const location = (r.location as { name?: unknown } | null)?.name;
    const text = typeof r.content === "string" ? plain(r.content) : null;
    push(out, r.id, r.title, location, text, r.absolute_url, r.first_published ?? r.updated_at);
  }
  return out;
}

export function parseLever(raw: unknown): AtsJob[] {
  if (!Array.isArray(raw)) return [];
  const out: AtsJob[] = [];
  for (const j of raw) {
    if (!j || typeof j !== "object") continue;
    const r = j as Record<string, unknown>;
    const location = (r.categories as { location?: unknown } | null)?.location;
    const lists = Array.isArray(r.lists)
      ? r.lists.map((l) => `${str((l as { text?: unknown })?.text, 200) ?? ""}\n${plain(String((l as { content?: unknown })?.content ?? ""))}`).join("\n")
      : "";
    const text = [str(r.descriptionPlain, TEXT_MAX), lists, str(r.additionalPlain, TEXT_MAX)].filter(Boolean).join("\n");
    push(out, r.id, r.text, location, text, r.hostedUrl, r.createdAt);
  }
  return out;
}

export const PARSERS: Record<Ats, (raw: unknown) => AtsJob[]> = { ashby: parseAshby, greenhouse: parseGreenhouse, lever: parseLever };
