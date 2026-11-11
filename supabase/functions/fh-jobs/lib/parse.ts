// Parsers for the jobs worker: a Getro board's company list (VC job boards), and the public job boards of
// Greenhouse, Ashby, Lever, Workable, Rippling and Gem. Every value from outside is checked; a row missing what a posting needs is dropped.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

export type Ats = "ashby" | "greenhouse" | "lever" | "workable" | "rippling" | "gem";

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
const RIPPLING_API = "https://api.rippling.com/platform/api/ats/v1/board";
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

/** Characters Postgres refuses in JSON: the null character, and half of a surrogate pair (cutting a text at a fixed
 *  length can split an emoji in two; one company's roles were refused for this on 2026-11-10). */
export const clean = (s: string): string =>
  s.replace(/\u0000/g, "").replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");

/** A posting must have text; a job with no description falls back to its title. */
const body = (text: string | null, title: string) => clean((text && text.length > 0 ? text : title).slice(0, TEXT_MAX));

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

const BOARD_URLS: Record<Ats, (slug: string) => string> = {
  ashby: (slug) => `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
  greenhouse: (slug) => `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
  lever: (slug) => `https://api.lever.co/v0/postings/${slug}?mode=json`,
  workable: (slug) => `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`,
  rippling: (slug) => `${RIPPLING_API}/${slug}/jobs`,
  gem: (slug) => `https://api.gem.com/job_board/v0/${slug}/job_posts/`,
};
export const boardUrl = (ats: Ats, slug: string): string => BOARD_URLS[ats](slug);
/** Rippling's list has no descriptions; each job's text is at its own address. */
export const ripplingJobUrl = (slug: string, id: string): string => `${RIPPLING_API}/${slug}/jobs/${encodeURIComponent(id)}`;

function push(out: AtsJob[], id: unknown, title: unknown, location: unknown, text: string | null, url: unknown, postedAt: unknown): void {
  const jobId = typeof id === "string" || typeof id === "number" ? String(id) : null;
  const t = str(title, TITLE_MAX);
  const u = httpsUrl(url);
  if (!jobId || !t || !u || out.length >= JOBS_PER_COMPANY_MAX) return;
  const place = str(location, 300);
  out.push({ id: jobId, title: clean(t), location: place ? clean(place) : null, text: body(text, t), url: u, postedAt: isoDate(postedAt) });
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

/** Workable's widget: {jobs: [{shortcode, title, url, city, state, country, telecommuting, description (HTML), published_on}]}. */
export function parseWorkable(raw: unknown): AtsJob[] {
  const jobs = (raw as { jobs?: unknown } | null)?.jobs;
  if (!Array.isArray(jobs)) return [];
  const out: AtsJob[] = [];
  for (const j of jobs) {
    if (!j || typeof j !== "object") continue;
    const r = j as Record<string, unknown>;
    const place = [r.city, r.state, r.country].map((v) => str(v, 100)).filter(Boolean).join(", ");
    const location = place || (r.telecommuting === true ? "Remote" : null);
    const text = typeof r.description === "string" ? plain(r.description) : null;
    push(out, r.shortcode, r.title, location, text, r.url, r.published_on ?? r.created_at);
  }
  return out;
}

/** Rippling's list: [{uuid, name, url, workLocation: {label}}], one row per location of a job, with no description.
 *  The same job's rows become one, its locations joined. */
export function parseRippling(raw: unknown): AtsJob[] {
  if (!Array.isArray(raw)) return [];
  const places = new Map<string, string[]>();
  const first: Record<string, unknown>[] = [];
  for (const j of raw) {
    if (!j || typeof j !== "object") continue;
    const r = j as Record<string, unknown>;
    if (typeof r.uuid !== "string") continue;
    const place = str((r.workLocation as { label?: unknown } | null)?.label, 100);
    const seen = places.get(r.uuid);
    if (!seen) first.push(r);
    places.set(r.uuid, place && !(seen ?? []).includes(place) ? [...(seen ?? []), place] : seen ?? []);
  }
  const out: AtsJob[] = [];
  for (const r of first) push(out, r.uuid, r.name, (places.get(r.uuid as string) ?? []).join("; "), null, r.url, null);
  return out;
}

/** One Rippling job: {description: {role, company} (HTML), createdOn}. */
export function parseRipplingJob(raw: unknown): { text: string | null; postedAt: string | null } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = (r.description && typeof r.description === "object" ? r.description : {}) as Record<string, unknown>;
  const text = [d.role, d.company].filter((v): v is string => typeof v === "string").map(plain).filter(Boolean).join("\n");
  return { text: text ? clean(text.slice(0, TEXT_MAX)) : null, postedAt: isoDate(r.createdOn) };
}

/** Gem's job board: [{id, title, absolute_url, location: {name}, content_plain, content (HTML), first_published_at}]. */
export function parseGem(raw: unknown): AtsJob[] {
  if (!Array.isArray(raw)) return [];
  const out: AtsJob[] = [];
  for (const j of raw) {
    if (!j || typeof j !== "object") continue;
    const r = j as Record<string, unknown>;
    const location = (r.location as { name?: unknown } | null)?.name;
    const text = str(r.content_plain, TEXT_MAX) ?? (typeof r.content === "string" ? plain(r.content) : null);
    push(out, r.id, r.title, location, text, r.absolute_url, r.first_published_at ?? r.created_at);
  }
  return out;
}

export const PARSERS: Record<Ats, (raw: unknown) => AtsJob[]> = {
  ashby: parseAshby, greenhouse: parseGreenhouse, lever: parseLever, workable: parseWorkable, rippling: parseRippling, gem: parseGem,
};

/** The order a company's board is looked for. Workable is last: it allows few requests a minute. */
export const ATS_ORDER: Ats[] = ["ashby", "greenhouse", "lever", "gem", "rippling", "workable"];

/** The systems a request asked for (`systems` in the body), in the usual order; all of them when it names none we know. */
export function pickSystems(v: unknown): Ats[] {
  const asked = Array.isArray(v) ? ATS_ORDER.filter((a) => v.includes(a)) : [];
  return asked.length > 0 ? asked : ATS_ORDER;
}

/** A job with the text and date read from its own address (Rippling), as a new object. */
export const withDetail = (job: AtsJob, d: { text: string | null; postedAt: string | null }): AtsJob =>
  ({ ...job, text: d.text ?? job.text, postedAt: d.postedAt ?? job.postedAt });
