/** What a company page and the short cards say. Nudge's voice: short, no full stops; errors without "!", each with
 *  what to do next (copy.test.ts). */
export const COMPANY_COPY = {
  loading: "Opening this company…",
  loadFailed: "This company didn't load, check your connection and try again",
  notFound: "This company couldn't be found, go back to your list and try another",
  roleNoPage: "This role has no company page yet, open the posting instead",
  openPosting: "Open the posting",
  tryAgain: "Try again",

  roles: "Open roles",
  pickRole: "Pick the role your message is about",
  bestFit: "Best fit",
  posting: "Posting",
  aboutRole: "About",
  noRoleChosen: "No open role listed, the message is about the company",
  noRoles: "No open roles listed right now",

  save: "Save",
  saved: "Saved",
  reachedOut: "I reached out",
  markedReached: "Reached out",
  notForMe: "Not for me",
  remove: "Remove",
  open: "Open",
  deciding: "Saving…",
  decideFailed: "That didn't save, check your connection and try again",

  todayTitle: "Today's five",
  todayLine: "Open one to see every role and write to someone there",
  moreFive: "Show five more",
  hidden: "Hidden from today",
} as const;

export const COMPANY_ERRORS = [COMPANY_COPY.loadFailed, COMPANY_COPY.notFound, COMPANY_COPY.roleNoPage, COMPANY_COPY.decideFailed] as const;

/** The line under the message heading: which role the message is about. */
export const aboutLine = (title: string): string => `${COMPANY_COPY.aboutRole}: ${title}`;

/** The picker's button for the roles past the first few. */
export const moreRolesLine = (n: number): string => `+${n} more ${n === 1 ? "role" : "roles"}`;

/** The header's key for a signed-out visitor. */
export const SIGN_IN_LABEL = "Sign in";
