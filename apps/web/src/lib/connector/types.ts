// The draft's shapes are the lead's (lib/drafts/generate.ts); this file only names the function the route is given,
// so the route's logic can be tested with the model mocked.
import type { DraftInput, DraftResult } from "../drafts/generate";

export type { Draft, DraftInput, DraftResult } from "../drafts/generate";
export type DraftFailure = Extract<DraftResult, { ok: false }>["reason"];
export type Generate = (input: DraftInput, deps: { apiKey: string }) => Promise<DraftResult>;
