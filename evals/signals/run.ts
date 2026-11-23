// Runs the signals rules (supabase/functions/fh-signals/lib/extract.ts) over a job board sample (default sample.json,
// the 120 postings v1 was never tuned on; sample2.json is the held-out set for v2) and, separately, the 40 new-grad postings (the rules WERE tuned on
// those). Writes sheet.md for the hand check and summary.json with counts and a model cost estimate. No network, no
// model calls: the cost is estimated from the exact request bodies the worker would send. Run:
// npx vite-node evals/signals/run.ts [sample file] [sheet file] [summary file]
// File names inside evals/signals/; defaults sample.json, sheet.md, summary.json (e.g. sample2.json sheet2.md summary2.json).
import { readFileSync, writeFileSync } from "node:fs";
import { extractSignals, SIGNALS_VERSION, type Signals } from "../../supabase/functions/fh-signals/lib/extract";
import { batchRequests, MODEL_REQUESTS_MAX, RESPONSE_SCHEMA, requestBody, SIGNALS_MODEL } from "../../supabase/functions/fh-signals/lib/model";
import { segmentsOf } from "../../supabase/functions/fh-signals/lib/sentences";

const DIR = new URL(".", import.meta.url);
const SHEET_QUOTE_MAX = 220;
const OPEN_POSTINGS = 36_981;
const CHARS_PER_TOKEN = 4;
/** One decision in the reply, e.g. {"n":12,"label":"not_experience"}: about 35 characters, assumed 12 tokens. */
const OUTPUT_TOKENS_PER_SENTENCE = 12;
/** The reply's wrapper, {"decisions":[...]}, assumed 10 tokens a request. */
const OUTPUT_TOKENS_PER_REQUEST = 10;
/** USD per million tokens: third-party figures for gemini-3.5-flash-lite, to be confirmed. Batch is half. */
const PRICE = { input: 0.3, output: 2.5 };

interface Posting { n: number; group: string; id: string; title: string; text: string }
interface Result extends Posting { signals: Signals }
type Violation = { id: string; field: string; quote: string };

const load = (path: string, group: (r: Record<string, unknown>) => string): Posting[] =>
  (JSON.parse(readFileSync(new URL(path, DIR), "utf8")) as Record<string, unknown>[]).map((r) => {
    if (typeof r.text !== "string" || typeof r.id !== "string") throw new Error(`${path}: row ${String(r.n)} has no text or id`);
    return { n: Number(r.n), group: group(r), id: r.id, title: typeof r.title === "string" ? r.title : String(r.text).slice(0, 60), text: r.text };
  });

/** Every quote and pending sentence of a result, by field name. */
const quotesOf = (s: Signals): [string, string][] => [
  ...(s.years ? [["years", s.years.quote] as [string, string]] : []),
  ...(s.salary ? [["salary", s.salary.quote] as [string, string]] : []),
  ...(s.visa ? [["visa", s.visa.quote] as [string, string]] : []),
  ...(s.equity ? [["equity", s.equity.quote] as [string, string]] : []),
  ...(s.k401 ? [["k401", s.k401.quote] as [string, string]] : []),
  ...s.pending.map((p) => [`pending ${p.kind}`, p.sentence] as [string, string]),
];

const violationsOf = (r: Result): Violation[] =>
  quotesOf(r.signals).filter(([, q]) => q.length === 0 || !r.text.includes(q)).map(([field, quote]) => ({ id: r.id, field, quote }));

const show = (q: string) => {
  const flat = q.replace(/\s+/g, " ").trim();
  return `"${flat.length > SHEET_QUOTE_MAX ? `${flat.slice(0, SHEET_QUOTE_MAX)}…` : flat}"`;
};

function headingOfQuote(text: string, quote: string): string {
  const seg = segmentsOf(text).find((s) => s.quote === quote || s.quote.includes(quote));
  return seg?.section ?? "none";
}

function linesOf(r: Result): string[] {
  const s = r.signals;
  const out = [
    s.years && `years: ${s.years.min} ${s.years.required ? "required" : "preferred"} | heading: ${headingOfQuote(r.text, s.years.quote)} | ${show(s.years.quote)}`,
    s.salary && `salary: ${s.salary.min}${s.salary.max === null ? "+" : `-${s.salary.max}`} ${s.salary.currency} ${s.salary.period} ote=${s.salary.ote} | ${show(s.salary.quote)}`,
    s.visa && `visa: ${s.visa.value} | ${show(s.visa.quote)}`,
    s.equity && `equity | ${show(s.equity.quote)}`,
    s.k401 && `k401 | ${show(s.k401.quote)}`,
    ...s.pending.map((p) => `pending: ${p.kind}${p.kind === "years" ? ` (${p.value})` : ""} | ${show(p.sentence)}`),
  ].filter((l): l is string => typeof l === "string");
  return (out.length > 0 ? out : ["none"]).map((l) => `- ${l} | check: `);
}

const block = (r: Result) => [`**${r.n}** · ${r.group} · \`${r.id}\` · ${r.title.replace(/\s+/g, " ")}`, ...linesOf(r), ""];

function counts(results: readonly Result[]) {
  const has = (f: (s: Signals) => boolean) => results.filter((r) => f(r.signals)).length;
  const visa = (v: string) => has((s) => s.visa?.value === v);
  return {
    postings: results.length,
    years: has((s) => s.years !== null),
    years_required_3plus: has((s) => s.years !== null && s.years.required && s.years.min >= 3),
    years_preferred: has((s) => s.years !== null && !s.years.required),
    salary: has((s) => s.salary !== null),
    salary_ote: has((s) => s.salary?.ote === true),
    visa: has((s) => s.visa !== null),
    visa_sponsors: visa("sponsors"),
    visa_no_sponsorship: visa("no_sponsorship"),
    visa_citizens_only: visa("citizens_only"),
    equity: has((s) => s.equity !== null),
    k401: has((s) => s.k401 !== null),
    none: has((s) => !s.years && !s.salary && !s.visa && !s.equity && !s.k401 && s.pending.length === 0),
    pending_postings: has((s) => s.pending.length > 0),
    pending_sentences: results.reduce((a, r) => a + r.signals.pending.length, 0),
    pending_years: results.reduce((a, r) => a + r.signals.pending.filter((p) => p.kind === "years").length, 0),
    pending_visa: results.reduce((a, r) => a + r.signals.pending.filter((p) => p.kind === "visa").length, 0),
  };
}

const byGroup = (results: readonly Result[]) =>
  Object.fromEntries([...new Set(results.map((r) => r.group))].map((g) => [g, counts(results.filter((r) => r.group === g))]));

function costOf(results: readonly Result[]) {
  const batches = batchRequests(results.map((r) => ({ id: r.n, pending: r.signals.pending })));
  const bodies = batches.map(requestBody);
  // Characters of everything sent: the JSON request body (system text, the fenced sentences, the response schema)
  const inputChars = bodies.reduce((a, b) => a + JSON.stringify(b).length, 0);
  const promptChars = bodies.reduce((a, b) => {
    const body = b as { systemInstruction: { parts: { text: string }[] }; contents: { parts: { text: string }[] }[] };
    return a + body.systemInstruction.parts[0].text.length + body.contents[0].parts[0].text.length;
  }, 0);
  const sentences = batches.reduce((a, b) => a + b.length, 0);
  const sample = {
    requests: batches.length, sentences, prompt_chars: promptChars, request_body_chars: inputChars,
    input_tokens_est: Math.ceil(inputChars / CHARS_PER_TOKEN),
    output_tokens_est: sentences * OUTPUT_TOKENS_PER_SENTENCE + batches.length * OUTPUT_TOKENS_PER_REQUEST,
  };
  const scale = OPEN_POSTINGS / results.length;
  const full = {
    postings: OPEN_POSTINGS, requests_est: Math.ceil(sample.requests * scale), sentences_est: Math.ceil(sentences * scale),
    worker_calls_est: Math.ceil((sample.requests * scale) / MODEL_REQUESTS_MAX),
    input_tokens_est: Math.ceil(sample.input_tokens_est * scale), output_tokens_est: Math.ceil(sample.output_tokens_est * scale),
  };
  const usd = (t: { input_tokens_est: number; output_tokens_est: number }, f: number) =>
    Math.round(((t.input_tokens_est * PRICE.input + t.output_tokens_est * PRICE.output) / 1e6) * f * 10_000) / 10_000;
  return {
    model: SIGNALS_MODEL,
    assumptions: [
      `Input tokens are an estimate: characters of the whole JSON request body (system text, fenced sentences, response schema) / ${CHARS_PER_TOKEN}. Not a tokenizer count.`,
      `Output tokens are an estimate: ${OUTPUT_TOKENS_PER_SENTENCE} a sentence (one {"n":..,"label":".."} object) plus ${OUTPUT_TOKENS_PER_REQUEST} a request for the wrapper. Thinking tokens, if the model uses any (requestBody sets no thinkingConfig), are billed as output and are not included.`,
      `Full run = the sample scaled by ${OPEN_POSTINGS}/${results.length} postings at the sample's pending rate: an upper bound, since the sample is enriched for signals.`,
      `Prices USD per million tokens: input ${PRICE.input}, output ${PRICE.output} (third-party figures for ${SIGNALS_MODEL}, to be confirmed); batch at half.`,
    ],
    response_schema_chars: JSON.stringify(RESPONSE_SCHEMA).length,
    sample, full_run: full,
    usd: { sample: usd(sample, 1), full_run: usd(full, 1), full_run_batch: usd(full, 0.5) },
  };
}

/** A plain file name inside evals/signals/, so the script never reads or writes elsewhere. */
function fileArg(value: string | undefined, fallback: string, ext: string): string {
  const name = value ?? fallback;
  if (!/^[\w.-]+$/.test(name) || !name.endsWith(ext)) throw new Error(`"${name}" must be a plain ${ext} file name in evals/signals/`);
  return name;
}

function main(): void {
  const sampleFile = fileArg(process.argv[2], "sample.json", ".json");
  const sheetFile = fileArg(process.argv[3], "sheet.md", ".md");
  const summaryFile = fileArg(process.argv[4], "summary.json", ".json");
  const run = (rows: Posting[]): Result[] => rows.map((p) => ({ ...p, signals: extractSignals(p.text) }));
  const sample = run(load(sampleFile, (r) => String(r.stratum)));
  const newGrad = run(load("../new-grad/postings.json", (r) => String(r.source)));
  const violations = [...sample, ...newGrad].flatMap(violationsOf);
  const summary = {
    signals_version: SIGNALS_VERSION,
    quote_violations: violations.length,
    sample: { file: sampleFile, note: "job board postings; held out only if no rules version was tuned on this file", ...counts(sample), by_stratum: byGroup(sample) },
    new_grad: { note: "the rules WERE tuned on these 40; not a held-out measure, and they have no user labels", ...counts(newGrad), by_source: byGroup(newGrad) },
    cost_estimate: costOf(sample),
  };
  const sheet = [
    "# Signals hand check", "",
    `Rules version ${SIGNALS_VERSION}, written by \`run.ts\`. One block per posting: n · stratum · id · title, then one line per signal (quotes cut at ${SHEET_QUOTE_MAX} characters here only). Fill \`check:\` with ok, or what is wrong. \`heading\` is the section the rules put the sentence in. This is a hand check of precision, not the user's labels.`, "",
    `Quotes not found word for word in their text: ${violations.length}.`, "",
    `## Sample: ${sampleFile}, ${sample.length} job board postings (held out only if no rules version was tuned on this file)`, "",
    ...sample.flatMap(block),
    "## New-grad set: 40 postings (the rules WERE tuned on these; not a held-out measure)", "",
    ...newGrad.flatMap(block),
  ];
  writeFileSync(new URL(sheetFile, DIR), sheet.join("\n"));
  writeFileSync(new URL(summaryFile, DIR), JSON.stringify(summary, null, 1) + "\n");
  console.log(`wrote ${sheetFile} and ${summaryFile}`);
  for (const v of violations) console.log(`VIOLATION ${v.id} ${v.field}: ${show(v.quote)}`);
  console.log(JSON.stringify(summary, null, 1));
}

main();
