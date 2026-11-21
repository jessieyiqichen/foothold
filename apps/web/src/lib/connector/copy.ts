import { DAILY_DRAFT_LIMIT } from "./constants";

/** What the draft says, on the card and from the route. Nudge's voice: short, no full stops; errors without "!",
 *  each with what to do next (copy.test.ts). The route never sends a raw error, only these lines. */
export const DRAFT_COPY = {
  heading: "A first message",
  write: "Write a draft",
  writing: "Writing a draft from your resume and this company…",
  subject: "Subject",
  body: "Message",
  copy: "Copy",
  copied: "Copied, paste it into your own email",
  copyFailed: "Couldn't copy, select the text and copy it yourself",
  again: "Write again",
  neverSends: "Foothold never sends anything for you",
  sendsLine: "Sends your experience, without contact details, to Google Gemini",
  consentTitle: "Before your first draft",
  agree: "Send and write",
  notNow: "Not now",
  noConsent: "A draft needs your agreement to send your experience to Google Gemini, tap Write a draft and agree first",

  signedOut: "You're signed out, sign in again to write a draft",
  badCompany: "That company couldn't be found, reload the page and try again",
  badRole: "That role is no longer open here, pick another one and try again",
  noResume: "Add your resume first, the draft is written from it",
  readFailed: "Your profile or this company didn't load, try again in a moment",
  limit: `No draft tries left today, you get ${DAILY_DRAFT_LIMIT} tries a day and Foothold has a shared daily total, both reset at midnight UTC`,
  notJson: "That request wasn't sent as JSON, reload the page and try again",
  notKept: "This draft isn't saved, copy it before you leave this page",
  loadFailed: "Your saved draft couldn't load, reload the page to see it",
  replaceTitle: "Write a new draft?",
  replaceBody: "Your changes to this draft will be replaced",
  replace: "Write again",
  keepEdits: "Keep my changes",
  noKey: "Drafts are switched off right now, try again later",
  busy: "The writing model is busy, try again in a minute",
  unavailable: "I couldn't reach the writing model, try again later",
  unverified: "The draft didn't hold up to checking, try again",
  badInput: "There isn't enough about this company to write from yet, try another card",
  failed: "The draft didn't come through, check your connection and try again",
};

export const DRAFT_ERRORS = [
  DRAFT_COPY.copyFailed, DRAFT_COPY.notKept, DRAFT_COPY.loadFailed, DRAFT_COPY.noConsent, DRAFT_COPY.notJson, DRAFT_COPY.signedOut, DRAFT_COPY.badCompany, DRAFT_COPY.badRole, DRAFT_COPY.noResume, DRAFT_COPY.readFailed, DRAFT_COPY.limit,
  DRAFT_COPY.noKey, DRAFT_COPY.busy, DRAFT_COPY.unavailable, DRAFT_COPY.unverified, DRAFT_COPY.badInput, DRAFT_COPY.failed,
];

/** What is sent where, shown before a person's first draft (user, 2026-11-16). The agreed words, one sentence a line,
 *  since the interface uses no full stops. */
export const CONSENT_LINES = [
  "To write this, Foothold sends your resume's experience to Google Gemini",
  "Your name, email, phone and links are taken out first",
  "On Gemini's free tier, Google may keep what is sent and people at Google may read it",
  "You must be 18 or older",
];
