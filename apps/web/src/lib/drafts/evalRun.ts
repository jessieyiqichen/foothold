// Runs the drafts eval set (evals/drafts/cases.json) for the signed-in person: each case is gathered exactly as a real
// draft is (connector/handle.ts gather), written by generateDraft, then read by the judge (judge.ts). Sequential, to
// stay inside the free tier's per-minute limit. Takes none of the person's daily tries: it runs on the dev server only.
import type { DraftInput, DraftResult } from "./generate";
import type { JudgeInput, Verdict } from "./judge";
import { resumeForModel } from "./redact";

export interface EvalCase { company_id: number; role_id: number; company: string; title: string; kind: string }
export interface CaseResult {
  case: EvalCase;
  outcome: "written" | "refused" | Exclude<DraftResult, { ok: true }>["reason"];
  note?: string;
  ms: number;
  draft?: { subject: string; body: string; resumeQuote: string; companyQuote: string; model: string };
  verdict?: Verdict | null;
}
export interface EvalSummary {
  cases: number; written: number; notWritten: number; judged: number; passed: number;
  failedTruthful: number; failedHuman: number; failedLetterFit: number; roleShort: number; meanReply: number | null; dropped: number;
}

export interface EvalDeps {
  gather: (companyId: number, roleId: number) => Promise<DraftInput | { status: number; body: unknown }>;
  generate: (input: DraftInput) => Promise<DraftResult>;
  judge: (input: JudgeInput) => Promise<Verdict | null>;
  now?: () => number;
}

export async function runCase(c: EvalCase, deps: EvalDeps): Promise<CaseResult> {
  const now = deps.now ?? Date.now;
  const start = now();
  const input = await deps.gather(c.company_id, c.role_id);
  if ("status" in input) return { case: c, outcome: "refused", note: JSON.stringify(input.body), ms: now() - start };
  const result = await deps.generate(input);
  if (!result.ok) return { case: c, outcome: result.reason, ms: now() - start };
  const { draft } = result;
  const verdict = await deps.judge({
    resume: resumeForModel(input.resumeText), pitch: input.pitch ?? null,
    company: [input.company.oneLiner, input.company.description].filter(Boolean).join("\n"),
    posting: input.posting ? `${input.posting.title}\n${input.posting.text}` : input.roles.map((r) => r.title).join("; "),
    email: { subject: draft.subject, body: draft.body },
  });
  return { case: c, outcome: "written", ms: now() - start, draft, verdict };
}

export function summarize(results: readonly CaseResult[]): EvalSummary {
  const written = results.filter((r) => r.outcome === "written");
  const judged = written.map((r) => r.verdict).filter((v): v is Verdict => Boolean(v));
  const scores = judged.map((v) => v.replyScore);
  return {
    cases: results.length, written: written.length, notWritten: results.length - written.length, judged: judged.length,
    passed: judged.filter((v) => v.pass).length,
    failedTruthful: judged.filter((v) => !v.truthful.pass).length,
    failedHuman: judged.filter((v) => !v.human.pass).length,
    failedLetterFit: judged.filter((v) => !v.letterFit.pass).length,
    roleShort: judged.filter((v) => !v.roleFit.pass).length,
    meanReply: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    dropped: judged.reduce((n, v) => n + v.dropped, 0),
  };
}
