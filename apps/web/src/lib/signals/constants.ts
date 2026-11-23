/** A quote is one sentence or bullet line copied from the posting, 1 to 400 characters (docs/judge-signals.md). */
export const MAX_QUOTE = 400;
/** Required years from this many up mean the role needs experience (the eval rule: 0 to 2 years is new grad); the
 *  server's needs_years, used when a row does not carry it. */
export const NEEDS_YEARS_MIN = 3;
/** More years than this is not a sane requirement: the answer is read as malformed. */
export const MAX_YEARS = 40;
/** The levels that turn "Hide roles needing years of experience" on by default, and those that keep it off. */
export const EARLY_LEVELS = ["intern", "entry"] as const;
export const LATE_LEVELS = ["senior", "management"] as const;
/** Signs written before an amount; any other currency is named by its code. */
export const CURRENCY_SIGNS: Readonly<Record<string, string>> = { USD: "$", GBP: "£", EUR: "€" };
