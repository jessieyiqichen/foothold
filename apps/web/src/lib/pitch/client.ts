// The profile page's side of the intro suggestion: asking the server route, which calls the model with the key.
import { fail, ok, type Result } from "../profile/types";
import { PITCH_COPY } from "./copy";

export const PITCH_PATH = "/api/pitch";

/** A suggested line, saying the person agreed to send their experience to Gemini; a refusal comes back with the
 *  route's own line. */
export async function requestPitch(fetcher: typeof fetch = fetch): Promise<Result<string>> {
  try {
    const response = await fetcher(PITCH_PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true }) });
    const answer: unknown = await response.json().catch(() => null);
    const record = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : {};
    if (response.ok && typeof record.pitch === "string" && record.pitch.trim()) return ok(record.pitch);
    if (typeof record.error === "string" && record.error.trim()) return fail(record.error);
    console.error(`Foothold pitch: the route answered ${response.status} in a shape the page does not know`);
    return fail(PITCH_COPY.failed);
  } catch (cause) {
    console.error("Foothold pitch: the request did not arrive", cause);
    return fail(PITCH_COPY.failed);
  }
}
