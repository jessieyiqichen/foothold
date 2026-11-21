import { serverDbForRequest } from "@/lib/db/server";
import { handlePitchRequest } from "@/lib/pitch/handle";
import { suggestPitch } from "@/lib/pitch/suggest";

export const maxDuration = 60;

/** POST /api/pitch, body `{ consent: true }`: a suggested one-line intro from the signed-in person's own resume, for
 *  them to edit on the profile page (lib/pitch/handle.ts has the rules). The key stays on the server. */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  const body: unknown = await request.json().catch(() => null);
  const answer = await handlePitchRequest(await serverDbForRequest(), { contentType, body, apiKey: process.env.GEMINI_API_KEY, suggest: suggestPitch });
  return Response.json(answer.body, { status: answer.status });
}
