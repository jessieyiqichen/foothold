// Fetches the two v1 sources. Uses only the global fetch, so a test can pass a fake one.

const TIMEOUT_MS = 30_000;
const USER_AGENT = "Foothold/1.0 (class project; https://github.com/jessieyiqichen/foothold)";
export const YC_URL = "https://yc-oss.github.io/api/companies/all.json";
const ALGOLIA = "https://hn.algolia.com/api/v1";

async function getJson(f: typeof fetch, url: string): Promise<unknown> {
  const res = await f(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${new URL(url).host} answered HTTP ${res.status}`);
  return res.json();
}

/** The whole YC directory (about 11 MB, 6,000 companies). */
export const fetchYc = (f: typeof fetch = fetch) => getJson(f, YC_URL);

/** The id of the newest "Ask HN: Who is hiring?" thread, from Algolia's search. */
export async function latestHiringThreadId(f: typeof fetch = fetch): Promise<string> {
  const q = encodeURIComponent('"Ask HN: Who is hiring"');
  const data = await getJson(f, `${ALGOLIA}/search_by_date?query=${q}&tags=story,author_whoishiring&hitsPerPage=1`);
  const hit = (data as { hits?: { objectID?: unknown; title?: unknown }[] })?.hits?.[0];
  if (!hit || typeof hit.objectID !== "string" || !/who is hiring/i.test(String(hit.title))) {
    throw new Error("Algolia returned no Who is hiring thread");
  }
  return hit.objectID;
}

/** One thread with all its top-level comments. */
export const fetchHnThread = (id: string, f: typeof fetch = fetch) => getJson(f, `${ALGOLIA}/items/${id}`);
