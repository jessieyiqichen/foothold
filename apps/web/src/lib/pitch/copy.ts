import { DAILY_DRAFT_LIMIT } from "../connector/constants";

/** What the intro suggestion says when it cannot help. Nudge's voice: no full stops, no "!", each says what to do next. */
export const PITCH_COPY = {
  signedOut: "You're signed out, sign in again to get a suggestion",
  notJson: "That request wasn't sent as JSON, reload the page and try again",
  noConsent: "A suggestion needs your agreement to send your experience to Google Gemini, agree first and try again",
  noKey: "Suggestions are switched off right now, write your own line",
  noResume: "Add your resume first, the suggestion is written from it",
  readFailed: "Your profile didn't load, try again in a moment",
  limit: `No tries left today, suggestions share the ${DAILY_DRAFT_LIMIT} daily tries with drafts, write your own line or try after midnight UTC`,
  busy: "The writing model is busy, try again in a minute",
  unavailable: "I couldn't reach the writing model, write your own line or try later",
  unverified: "I couldn't suggest a line that held up to checking, write your own or try again",
  failed: "The suggestion didn't come through, check your connection and try again",
} as const;
