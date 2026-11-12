import { MAX_PDF_BYTES, MAX_PDF_PAGES, MAX_RESUME_CHARS, MIN_RESUME_CHARS } from "./constants";
import { MAX_TAGS } from "./vocabulary";

const count = (n: number) => n.toLocaleString("en-US");
const MAX_MB = `${MAX_PDF_BYTES / (1024 * 1024)} MB`;
const PASTE_INSTEAD = "paste your resume as text below instead";

/** What the profile page says. House style: no full stops, errors without "!" and each with what to do next
 *  (copy.test.ts). The limits are read from the constants so a line never disagrees with the check behind it. */
export const PROFILE_COPY = {
  title: "Your profile",
  intro: "Add your resume to see the skills roles are matched on",
  loading: "Loading your profile…",
  tryAgain: "Try again",

  fileLabel: "Resume PDF",
  fileHint: `Read here in your browser, the file itself is never uploaded · PDF up to ${MAX_MB}`,
  reading: "Reading your PDF…",
  textLabel: "Resume text",
  textHint: "Check it reads right and fix anything the PDF got wrong, or paste your resume here",
  tagsHeading: "Skills found",
  tagsNote: "Found with the same word list that tags every role, so you and a role are matched on the same words",
  noTags: "Skills show here once there is resume text above",
  save: "Save profile",
  saving: "Saving…",
  cancel: "Cancel",
  storedNote: "Saving keeps this text and these skills in your account, only you can read them and you can delete them any time",
  saved: "Profile saved",

  savedHeading: "Your skills",
  editHint: "Roles are matched on these, tap one to take it off if it isn't you",
  yours: "added by you",
  addHeading: "Add a skill",
  addHint: "Skills from the same word list that aren't on your profile yet, tap one to add it",
  savingEdit: "Saving…",
  undo: "Undo",
  replace: "Replace resume",
  delete: "Delete my resume",
  confirmTitle: "Delete your resume?",
  confirmBody: "Your resume text and skills are removed from your account for good, you can add a resume again any time",
  confirmDelete: "Yes, delete it",
  deleting: "Deleting…",
  keep: "Keep it",
  deleted: "Your resume is deleted",

  notPdf: "That file isn't a PDF, choose a PDF or " + PASTE_INSTEAD,
  emptyFile: "That file is empty, choose another PDF or " + PASTE_INSTEAD,
  tooBig: `That PDF is over ${MAX_MB}, choose a smaller one or ${PASTE_INSTEAD}`,
  tooManyPages: `That PDF has more than ${MAX_PDF_PAGES} pages, choose your resume or ${PASTE_INSTEAD}`,
  noTextInPdf: "No text could be read from that PDF, it may be a scan or an image, " + PASTE_INSTEAD,
  locked: "That PDF is locked with a password, choose an unlocked copy or " + PASTE_INSTEAD,
  unreadable: "That PDF couldn't be read, try another copy or " + PASTE_INSTEAD,
  emptyText: "There is no resume yet, choose a PDF or paste your resume as text",
  tooShort: `That is under ${count(MIN_RESUME_CHARS)} characters, add the rest of your resume`,
  tooLong: `That is over ${count(MAX_RESUME_CHARS)} characters, cut it down to your resume alone`,
  loadFailed: "Your profile didn't load, check your connection and try again",
  saveFailed: "Your profile didn't save, check your connection and try again",
  deleteFailed: "Your resume wasn't deleted, check your connection and try again",
  signedOut: "You're signed out, sign in again to see your profile",
  editFailed: "That change didn't save and your skills are as they were, check your connection and try again",
  changedElsewhere: "Your profile changed in another tab, this is how it is now, make that change again if you still want it",
  tagsFull: `A profile holds ${MAX_TAGS} skills, take one off to add another`,
};

/** The lines that report a problem, for the style check. */
export const PROFILE_ERRORS = [
  PROFILE_COPY.notPdf, PROFILE_COPY.emptyFile, PROFILE_COPY.tooBig, PROFILE_COPY.tooManyPages, PROFILE_COPY.noTextInPdf,
  PROFILE_COPY.locked, PROFILE_COPY.unreadable, PROFILE_COPY.emptyText, PROFILE_COPY.tooShort, PROFILE_COPY.tooLong,
  PROFILE_COPY.loadFailed, PROFILE_COPY.saveFailed, PROFILE_COPY.deleteFailed, PROFILE_COPY.signedOut,
  PROFILE_COPY.editFailed, PROFILE_COPY.changedElsewhere, PROFILE_COPY.tagsFull,
];

export const removeLabel = (tag: string, mine: boolean) => (mine ? `Remove ${tag}, ${PROFILE_COPY.yours}` : `Remove ${tag}`);
export const addLabel = (tag: string) => `Add ${tag}`;
export const removedLine = (tag: string) => `Took off ${tag}`;
export const addedLine = (tag: string) => `Added ${tag}`;
export const offeredCount = (label: string, count: number) => `${label} · ${count} more`;

export const charCountLine = (chars: number) => `${count(chars)} of ${count(MAX_RESUME_CHARS)} characters`;

/** "Saved Nov 11, 2026, 6:00 PM from resume.pdf", in the reader's own time zone unless one is given. */
export function savedLine(updatedAt: string, resumeName: string | null, timeZone?: string): string {
  const when = new Date(updatedAt)
    .toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone })
    // Newer browsers put a narrow no-break space before AM and PM
    .replace(/\u202f/g, " ");
  return resumeName ? `Saved ${when} from ${resumeName}` : `Saved ${when}`;
}
