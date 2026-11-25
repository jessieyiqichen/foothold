/** What the role page says (the role leads, one action card beside it; user, 2026-11-23). Nudge's voice: short, no
 *  full stops, no em dashes; errors without "!", each with what to do next (pageCopy.test.ts). */
export const ROLE_PAGE_COPY = {
  // The action card
  writeFirst: "Write my first message",
  openDraft: "Open your draft",
  back: "Back",
  whoToContact: "Who to contact:",
  noneFound: "none found yet",
  foundersYc: "Founders on YC",
  howItWorks: "How it works",
  howSteps: [
    { title: "Check the fit", line: "One line on why, and any red flag" },
    { title: "Write your message", line: "A short draft from your resume" },
    { title: "Find who to contact", line: "You send it yourself" },
  ],
  notRight: "Not the right role?",
  signInWhy: "Sign in to see why this fits you",
  signInWrite: "Sign in to write your first message",

  // The reason sentence and its warnings
  noShared: "None of your skills are named in this role yet",
  asksFor: "match this role",
  asksForOne: "matches this role",
  graduation: "Your graduation date falls outside the window this role hires for",
  citizensOnly: "Open to US citizens only",
  noSponsorship: "Does not sponsor visas",

  // The left column
  from: "From",
  upTo: "Up to",
  plusEquity: "+ equity",
  remote: "Remote",
  internship: "Internship",
  fullTime: "Full-time",
  preferred: "preferred",
  atGlance: "At a glance",
  asksTitle: "What they ask for",
  readFull: "Read the full posting",
  showLess: "Show less",
  original: "Open the original posting",
  postingLoading: "Loading the posting…",
  postingFailed: "The posting text didn't load, try again or open the original posting",
  tryAgain: "Try again",

  facts: "Company facts",
  littleKnown: "Not much known yet",
  stage: "Stage",
  batch: "YC batch",
  team: "Team size",
  investors: "Investors",
  recent: "Roles posted, last 60 days",
  posted: "Last posted",
  website: "Website",

  similar: "See similar roles",
  openRoles: "Open roles",
} as const;

export const ROLE_PAGE_ERRORS = [ROLE_PAGE_COPY.postingFailed] as const;

/** The warning for a role that requires years of experience. */
export const needsYearsLine = (years: number): string => `Asks for ${years}+ years of experience`;
/** The action card's title. */
export const reachOutLine = (company: string): string => `Reach out to ${company}`;
/** The heading over the company's other open roles, with how many there are. */
export const moreRolesTitle = (company: string, n: number): string => `More roles at ${company} (${n})`;
/** The key that shows the rest of the other roles in place. */
export const seeAllLine = (n: number): string => `See all ${n}`;
/** The heading over the company's facts. */
export const aboutCompanyLine = (company: string): string => `About ${company}`;
/** The team size in the facts table. */
export const peopleLine = (n: number): string => `${n} ${n === 1 ? "person" : "people"}`;
