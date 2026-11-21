// POST /api/pitch as logic the tests can run: a suggested one-line intro from the signed-in person's own resume. Read
// with their own token, so row-level security decides what they reach. One of the day's draft tries is taken
// (fh_take_draft_run, with no company), so suggestions and drafts share the same limits. Nothing is saved here: the
// person edits the line and saves it from the profile page.
import type { SupabaseClient } from "@supabase/supabase-js";
import { TAKE_RUN_RPC } from "../connector/constants";
import { isJson } from "../connector/handle";
import { PITCH_COPY } from "./copy";
import type { PitchResult } from "./suggest";

export type PitchDb = Pick<SupabaseClient, "from" | "rpc">;
export type Suggest = (resumeText: string, deps: { apiKey: string }) => Promise<PitchResult>;
export type PitchAnswer = { status: number; body: { pitch: string } | { error: string } };

const refuse = (status: number, error: string): PitchAnswer => ({ status, body: { error } });
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const FAILURES: Record<Exclude<PitchResult, { ok: true }>["reason"], [number, string]> = {
  rate_limited: [429, PITCH_COPY.busy],
  unavailable: [503, PITCH_COPY.unavailable],
  unverified: [422, PITCH_COPY.unverified],
  bad_input: [409, PITCH_COPY.noResume],
};

export async function handlePitchRequest(
  signedIn: { db: PitchDb; userId: string } | null,
  deps: { contentType: string | null; body: unknown; apiKey: string | undefined; suggest: Suggest },
): Promise<PitchAnswer> {
  if (!signedIn) return refuse(401, PITCH_COPY.signedOut);
  if (!isJson(deps.contentType)) return refuse(415, PITCH_COPY.notJson);
  if (!isRecord(deps.body) || deps.body.consent !== true) return refuse(400, PITCH_COPY.noConsent);
  if (!deps.apiKey) {
    console.error("Foothold pitch: GEMINI_API_KEY is not set on the server");
    return refuse(503, PITCH_COPY.noKey);
  }
  const { db, userId } = signedIn;
  try {
    const profile = await db.from("fh_profiles").select("resume_text").eq("user_id", userId).maybeSingle();
    if (profile.error) throw new Error(profile.error.message);
    const resume = isRecord(profile.data) && typeof profile.data.resume_text === "string" ? profile.data.resume_text : "";
    if (!resume.trim()) return refuse(409, PITCH_COPY.noResume);
    const run = await db.rpc(TAKE_RUN_RPC, { p_company: null });
    if (run.error) throw new Error(run.error.message);
    if (run.data !== true) return refuse(429, PITCH_COPY.limit);
    const result = await deps.suggest(resume, { apiKey: deps.apiKey }).catch((cause: unknown) => {
      console.error("Foothold pitch: the model call threw", cause instanceof Error ? cause.message : cause);
      return { ok: false, reason: "unavailable" } as const;
    });
    return result.ok ? { status: 200, body: { pitch: result.pitch } } : refuse(...FAILURES[result.reason]);
  } catch (cause) {
    console.error("Foothold pitch: could not read the profile or take a try", cause instanceof Error ? cause.message : cause);
    return refuse(502, PITCH_COPY.readFailed);
  }
}
