/** What the draft says, on the card and from the route. Nudge's voice: short, no full stops; errors without "!",
 *  each with what to do next (copy.test.ts). The route never sends a raw error, only these lines. */
export const DRAFT_COPY = {
  write: "Write a draft",
  writing: "Writing a draft from your resume and this company…",
  subject: "Subject",
  body: "Message",
  copy: "Copy",
  copied: "Copied, paste it into your own email",
  copyFailed: "Couldn't copy, select the text and copy it yourself",
  again: "Write again",
  basedOn: "Based on",
  fromResume: "From your resume",
  fromCompany: "From the company",
  neverSends: "Foothold never sends anything for you",

  signedOut: "You're signed out, sign in again to write a draft",
  badCompany: "That company couldn't be found, reload the page and try again",
  noResume: "Add your resume first, the draft is written from it",
  readFailed: "Your profile or this company didn't load, try again in a moment",
  limit: "You've written 10 drafts today, you can write more tomorrow",
  noKey: "Drafts are switched off right now, try again later",
  busy: "The writing model is busy, try again in a minute",
  unavailable: "The writing model didn't answer, try again in a minute",
  unverified: "The draft quoted something I couldn't find in your resume or this company, so I didn't show it, try Write again",
  badInput: "There isn't enough about this company to write from yet, try another card",
  failed: "The draft didn't come through, check your connection and try again",
};

export const DRAFT_ERRORS = [
  DRAFT_COPY.copyFailed, DRAFT_COPY.signedOut, DRAFT_COPY.badCompany, DRAFT_COPY.noResume, DRAFT_COPY.readFailed, DRAFT_COPY.limit,
  DRAFT_COPY.noKey, DRAFT_COPY.busy, DRAFT_COPY.unavailable, DRAFT_COPY.unverified, DRAFT_COPY.badInput, DRAFT_COPY.failed,
];
