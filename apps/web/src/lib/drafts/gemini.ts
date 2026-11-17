// One call to Gemini's Interactions API (the shape its docs showed on 2026-11-16: POST /v1beta/interactions with the
// key in the x-goog-api-key header, a JSON schema in response_format). Server only: the key never reaches a browser
// and never goes in a URL. Every outcome is a value, never a throw.

export const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const API_REVISION = "2026-05-20";
const TIMEOUT_MS = 25_000;

export type AskResult =
  | { ok: true; json: unknown }
  | { ok: false; reason: "rate_limited" | "unavailable" | "bad_output" | "failed" };

export interface AskRequest {
  apiKey: string;
  model: string;
  system: string;
  input: string;
  schema: Record<string, unknown>;
  fetch?: typeof fetch;
}

const record = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** The model's text: `output_text` when the reply has it, else the text blocks of the last step. */
export function outputText(reply: unknown): string | null {
  const r = record(reply);
  if (!r) return null;
  if (typeof r.output_text === "string") return r.output_text;
  const steps = Array.isArray(r.steps) ? r.steps : [];
  const last = record(steps[steps.length - 1]);
  const blocks = last && Array.isArray(last.content) ? last.content : [];
  const texts = blocks.map((b) => record(b)).filter((b) => b?.type === "text" && typeof b.text === "string").map((b) => b!.text as string);
  return texts.length > 0 ? texts.join("") : null;
}

function failure(status: number): AskResult {
  if (status === 429) return { ok: false, reason: "rate_limited" };
  if (status === 400 || status === 403 || status === 404) return { ok: false, reason: "unavailable" };
  return { ok: false, reason: "failed" };
}

export async function askGemini(req: AskRequest): Promise<AskResult> {
  const f = req.fetch ?? fetch;
  try {
    const res = await f(GEMINI_URL, {
      method: "POST",
      headers: { "x-goog-api-key": req.apiKey, "Content-Type": "application/json", "Api-Revision": API_REVISION },
      body: JSON.stringify({
        model: req.model, system_instruction: req.system, input: req.input,
        response_format: { type: "text", mime_type: "application/json", schema: req.schema },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return failure(res.status);
    const text = outputText(await res.json());
    if (text === null) return { ok: false, reason: "bad_output" };
    return { ok: true, json: JSON.parse(text) };
  } catch (e) {
    return e instanceof SyntaxError ? { ok: false, reason: "bad_output" } : { ok: false, reason: "failed" };
  }
}
