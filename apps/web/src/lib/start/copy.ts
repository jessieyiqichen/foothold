import { MAX_FAMILIES } from "../profile/constants";
import { STEP_COUNT, type Step } from "./constants";

const count = (n: number) => n.toLocaleString("en-US");

/** What the first visit says. Nudge's voice (docs/archive/AGENTS-a3-a5.md): short, warm, cheering progress; no full
 *  stops; errors without "!" and each with what to do next (copy.test.ts). One sentence a screen. */
export const START_COPY = {
  back: "← Back",
  loading: "Getting your place ready…",
  loadFailed: "Your profile didn't load, check your connection and try again",
  tryAgain: "Try again",

  resumeHeading: "First, your resume",
  resumeLine: "I'll read it here in your browser and find the skills roles look for",
  dropLabel: "Drop your resume PDF here, or tap to choose it",
  dropHint: "Up to 5 MB, the file itself never leaves your device",
  chosen: "Ready to read",
  pasteLink: "No PDF? Paste the text",
  pdfLink: "Use a PDF instead",
  pasteLabel: "Your resume as text",
  readIt: "Read it",
  reading: "Reading…",
  noFile: "Choose your resume PDF first, or paste the text",

  skillsHeading: "Here's what I read",
  skillsLine: "Tap a skill off if it isn't you",
  noSkills: "I didn't spot any skills yet, add yours from the list below",
  missingLink: "Missing something?",
  missingLine: "Every skill roles are tagged with, by group, tap one to add it",
  textLink: "See the text I read",
  looksRight: "Looks right",

  directionsHeading: "What kind of work do you want?",
  directionsLine: `Pick up to ${["none", "one", "two", "three"][MAX_FAMILIES] ?? MAX_FAMILIES}, I'll show those first`,
  suggestedFamilies: "My guess from your resume, change it if I got it wrong",
  next: "Next",
  pickOne: "Pick at least one kind of work, then tap Next",

  levelsHeading: "Which levels should I show?",
  suggestedLevels: "My suggestion for someone starting out, tap to change it",
  levelsNote: "I read the level from the job title, and you can change this any time",
  levelsNone: "Nothing picked, I'll show every level",

  counting: "Counting your roles…",
  foundLine: "Ranked by the kinds of work you picked, then by your skills",
  zeroHeading: "No roles yet for that mix",
  zeroLine: "Try another kind of work or one more, there are many more roles nearby",
  widen: "Change the kinds of work",
  seeFive: "See today's five",
  countFailed: "I couldn't count your roles, check your connection and try again",

  saving: "Saving…",
};

/** The lines that report a problem, for the style check. */
export const START_ERRORS = [START_COPY.loadFailed, START_COPY.noFile, START_COPY.pickOne, START_COPY.countFailed];

export const stepLine = (step: Step): string => `Step ${step} of ${STEP_COUNT}`;
export const foundHeading = (total: number): string => `I found ${count(total)} ${total === 1 ? "role" : "roles"} for you!`;
