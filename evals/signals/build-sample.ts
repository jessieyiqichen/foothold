// Builds the held-out sample for the Judge signals hand check (docs/judge-signals.md, "Measuring"). Reads the 120
// `stratum source_id` lines of sample-ids.txt (open ATS postings, one per company) and fetches each posting's text again
// from its company's public job board through the jobs worker's own parsers, so the text (cut to TEXT_MAX by the parser)
// is the same text fh_postings holds, except that email addresses and phone numbers are masked (redact.ts) before the
// file is written, because this repo is public. One request per board, sequential, GAP_MS apart (Lever's robots.txt asks for a
// one-second crawl delay). A posting no longer on its board is recorded in missing.json, never substituted.
// No model calls, no keys. Run: npx vite-node evals/signals/build-sample.ts [ids file] [output file]
// Both are file names inside evals/signals/ (defaults sample-ids.txt and sample.json); the missing list goes to
// missing.json for the default output, else to <output>-missing.json.
import { readFileSync, writeFileSync } from "node:fs";
import { type Ats, boardUrl, PARSERS } from "../../supabase/functions/fh-jobs/lib/parse";
import { redact } from "./redact";

const DIR = new URL(".", import.meta.url);
const SYSTEMS: readonly Ats[] = ["ashby", "greenhouse", "lever"];
const GAP_MS = 1_000;
const TIMEOUT_MS = 30_000;
const USER_AGENT = "Foothold-eval/1.0 (class project; signals eval sample builder)";

interface Entry { n: number; stratum: string; id: string; ats: Ats; slug: string; jobId: string }
interface Row { n: number; stratum: string; id: string; company: string; title: string; url: string; text: string }
interface Missing { n: number; stratum: string; id: string; reason: string }

/** Lines `stratum source_id`; `#` comments and blank lines skipped. n is the entry's position in the file. */
function parseIds(raw: string): Entry[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("#"));
  const entries = lines.map((line, i) => {
    const [stratum, id, ...extra] = line.split(/\s+/);
    const [ats, slug, ...rest] = (id ?? "").split(":");
    const jobId = rest.join(":");
    if (!stratum || !id || extra.length > 0 || !SYSTEMS.includes(ats as Ats) || !slug || !jobId) {
      throw new Error(`ids line "${line}" is not "stratum ats:slug:job_id" for Ashby, Greenhouse or Lever`);
    }
    return { n: i + 1, stratum, id, ats: ats as Ats, slug, jobId };
  });
  const boards = entries.map((e) => `${e.ats}:${e.slug.toLowerCase()}`);
  const dup = boards.find((b, i) => boards.indexOf(b) !== i);
  if (dup) throw new Error(`the ids file has two postings from one board (${dup}); the sample is one per company`);
  return entries;
}

type Fetched = { ok: true; row: Row } | { ok: false; reason: string };

async function fetchEntry(e: Entry): Promise<Fetched> {
  let res: Response;
  try {
    res = await fetch(boardUrl(e.ats, e.slug), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, reason: `fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!res.ok) return { ok: false, reason: `board answered HTTP ${res.status}` };
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return { ok: false, reason: "board answered with something other than JSON" };
  }
  const jobs = PARSERS[e.ats](raw, e.slug);
  const job = jobs.find((j) => j.id === e.jobId);
  if (!job) return { ok: false, reason: `not on the board (board lists ${jobs.length} roles)` };
  return { ok: true, row: { n: e.n, stratum: e.stratum, id: e.id, company: e.slug, title: job.title, url: job.url, text: job.text } };
}

/** A plain file name inside evals/signals/, so the script never writes elsewhere. */
function fileArg(value: string | undefined, fallback: string, ext: string): string {
  const name = value ?? fallback;
  if (!/^[\w.-]+$/.test(name) || !name.endsWith(ext)) throw new Error(`"${name}" must be a plain ${ext} file name in evals/signals/`);
  return name;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const idsFile = fileArg(process.argv[2], "sample-ids.txt", ".txt");
  const outFile = fileArg(process.argv[3], "sample.json", ".json");
  const missingFile = outFile === "sample.json" ? "missing.json" : outFile.replace(/\.json$/, "-missing.json");
  const entries = parseIds(readFileSync(new URL(idsFile, DIR), "utf8"));
  console.log(`${entries.length} postings, ${entries.length} board requests (sequential, ${GAP_MS} ms apart), 0 model calls`);
  const rows: Row[] = [];
  const missing: Missing[] = [];
  for (const [i, e] of entries.entries()) {
    if (i > 0) await sleep(GAP_MS);
    const r = await fetchEntry(e);
    if (r.ok) rows.push(r.row);
    else missing.push({ n: e.n, stratum: e.stratum, id: e.id, reason: r.reason });
    if (!r.ok) console.log(`  missing #${e.n} ${e.id}: ${r.reason}`);
  }
  const redacted = rows.map((row) => ({ row, r: redact(row.text) }));
  const emails = redacted.reduce((a, x) => a + x.r.emails, 0);
  const phones = redacted.reduce((a, x) => a + x.r.phones, 0);
  console.log(`${outFile}: masked ${emails} email addresses and ${phones} phone numbers`);
  writeFileSync(new URL(outFile, DIR), JSON.stringify(redacted.map((x) => ({ ...x.row, text: x.r.text })), null, 1) + "\n");
  writeFileSync(new URL(missingFile, DIR), JSON.stringify(missing, null, 1) + "\n");
  console.log(`wrote ${outFile} and ${missingFile}`);
  const byStratum = (list: { stratum: string }[]) =>
    Object.entries(list.reduce<Record<string, number>>((acc, x) => ({ ...acc, [x.stratum]: (acc[x.stratum] ?? 0) + 1 }), {}))
      .map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`found ${rows.length} of ${entries.length} (${byStratum(rows)}); missing ${missing.length}${missing.length ? ` (${byStratum(missing)})` : ""}`);
}

await main();
