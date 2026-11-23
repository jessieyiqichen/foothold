// Who may spend the paid model key: a caller whose x-fh-worker-key header equals the FH_WORKER_KEY secret.
// No Deno or Node imports.

/** Minimum length of the worker key: a short secret is refused as if it were missing. */
export const WORKER_KEY_MIN = 32;

/** True only when both are strings, the secret is set and long enough, and they are equal. The comparison runs over
 *  the full length of the given value whatever it holds, so its time does not tell how much of it matched. */
export function sameSecret(given: unknown, secret: unknown): boolean {
  if (typeof given !== "string" || typeof secret !== "string" || secret.length < WORKER_KEY_MIN) return false;
  let diff = given.length ^ secret.length;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
  return diff === 0;
}
