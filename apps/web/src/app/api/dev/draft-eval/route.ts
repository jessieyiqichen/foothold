import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gather } from "@/lib/connector/handle";
import { serverDbForRequest } from "@/lib/db/server";
import { runCase, summarize, type CaseResult, type EvalCase } from "@/lib/drafts/evalRun";
import { generateDraft } from "@/lib/drafts/generate";
import { judgeDraft } from "@/lib/drafts/judge";

const EVALS = path.join(process.cwd(), "..", "..", "evals", "drafts");

/** POST /api/dev/draft-eval, body `{ consent: true, run: "<name>", index: n }`: runs case n of the drafts eval set for
 *  the signed-in person and adds its result to evals/drafts/runs/<name>.json, on the local dev server only (404 in
 *  production). One case a request, so each reads with a fresh sign-in token (one request for all twelve outlived its
 *  token; 2026-11-22). Their own resume, read with their own token, as a real draft is; none of their daily tries are
 *  taken. Git ignores the runs folder: the letters quote the resume. Answers with the case's result and the summary so
 *  far. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const signedIn = await serverDbForRequest();
  if (!signedIn) return Response.json({ error: "Sign in first" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (record.consent !== true) return Response.json({ error: "The eval sends your experience to Gemini, agree first" }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY is not set" }, { status: 503 });
  const name = typeof record.run === "string" && /^[a-z0-9-]{1,60}$/.test(record.run) ? record.run : null;
  const all = (JSON.parse(await readFile(path.join(EVALS, "cases.json"), "utf8")) as { cases: EvalCase[] }).cases;
  const index = typeof record.index === "number" && Number.isInteger(record.index) ? record.index : -1;
  if (!name || index < 0 || index >= all.length) return Response.json({ error: "Name the run and a case index", cases: all.length }, { status: 400 });

  const { db, userId } = signedIn;
  const c = all[index];
  const result = await runCase(c, {
    gather: (companyId, roleId) => gather(db, userId, companyId, roleId, false),
    generate: (input) => generateDraft(input, { apiKey }),
    judge: (input) => judgeDraft(input, { apiKey }),
  }).catch((cause: unknown): CaseResult => ({ case: c, outcome: "unavailable", note: cause instanceof Error ? cause.message : String(cause), ms: 0 }));

  const file = path.join(EVALS, "runs", `${name}.json`);
  await mkdir(path.dirname(file), { recursive: true });
  const before = await readFile(file, "utf8").then((t) => JSON.parse(t) as { results: CaseResult[] }).catch(() => ({ results: [] as CaseResult[] }));
  const results = [...before.results.filter((r) => r.case.role_id !== c.role_id), result];
  const run = { run: name, updated: new Date().toISOString(), summary: summarize(results), results };
  await writeFile(file, JSON.stringify(run, null, 2));
  return Response.json({ result: { case: c, outcome: result.outcome, note: result.note, pass: result.verdict?.pass ?? null }, summary: run.summary });
}
