import { generateDraft } from "@/lib/drafts/generate";
import { serverDbForRequest } from "@/lib/db/server";
import { handleDraftRequest } from "@/lib/connector/handle";

/** POST /api/drafts, body `{ company_id }`: a draft first message to someone at that company, written by the model
 *  from the signed-in person's own resume and the company's own words (lib/connector/handle.ts has the rules). The
 *  key stays on the server: `GEMINI_API_KEY`, never a `NEXT_PUBLIC_` name. Nothing is ever sent for the person. */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const answer = await handleDraftRequest(await serverDbForRequest(), {
    body,
    apiKey: process.env.GEMINI_API_KEY,
    generate: generateDraft,
    now: new Date(),
  });
  return Response.json(answer.body, { status: answer.status });
}
