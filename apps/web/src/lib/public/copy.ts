/** What signed-out visitors read. Nudge's voice: no full stops; errors without "!", each says what to do next. */
export const PUBLIC_COPY = {
  openRoles: "open roles",
  addedWeek: "added this week",
  hiringCompanies: "companies hiring",
  statsFailed: "The numbers didn't load, the roles below are still current",
  loading: "Finding roles…",
  loadFailed: "Roles didn't load, check your connection and try again",
  empty: "No role matches these filters, clear one to see more",
  bannerTitle: "Open roles, from company job boards and Hacker News hiring posts",
  bannerLine: "Add your resume to see which of these fit you, who to write to and a first message",
  bannerButton: "Sign in to see your matches",
  lockedTitle: "Yours once you sign in",
  lockedLines: ["Why it fits you, from your resume", "Who to contact there", "A first message about the role you pick", "Save it to come back to"],
  lockedButton: "Sign in to see your matches",
} as const;

export const PUBLIC_ERRORS = [PUBLIC_COPY.statsFailed, PUBLIC_COPY.loadFailed, PUBLIC_COPY.empty] as const;
