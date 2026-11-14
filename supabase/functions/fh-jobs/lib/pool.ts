// Runs async work over a list with at most `limit` running at once, like Promise.allSettled but bounded, so one call
// of the worker never opens more than a few connections to one job board host or the database.
// No Deno or Node imports.

export async function settleLimited<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        out[i] = { status: "fulfilled", value: await work(items[i]) };
      } catch (reason) {
        out[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, lane));
  return out;
}
