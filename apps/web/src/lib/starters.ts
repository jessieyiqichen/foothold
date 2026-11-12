import type { GoalType } from "./types";

export interface Site {
  key: string;
  label: string;
  link: string | null;
}

export interface Starter {
  key: string;
  label: string;
  verb: string;
  unit: string;
  type: GoalType;
  link: string | null;
  /** Sites to pick from on the first screen; the first is picked to begin with. */
  sites?: Site[];
}

/** Where applications are made (user, 2026-10-18: job applications should open a recruiting site too). */
const JOB_SITES: Site[] = [
  { key: "linkedin-jobs", label: "LinkedIn Jobs", link: "https://www.linkedin.com/jobs/" },
  { key: "handshake", label: "Handshake", link: "https://app.joinhandshake.com/" },
  { key: "indeed", label: "Indeed", link: "https://www.indeed.com/" },
];

/** First-visit choices: recruiting tasks people put off. How many and by when are asked next, one tap each. */
export const STARTERS: Starter[] = [
  { key: "linkedin", label: "LinkedIn connections", verb: "Send", unit: "connection requests", type: "by-date", link: "https://www.linkedin.com/mynetwork/grow/" },
  { key: "applications", label: "Job applications", verb: "Send", unit: "applications", type: "daily", link: JOB_SITES[0].link, sites: JOB_SITES },
  { key: "coffee", label: "Coffee chats", verb: "Message", unit: "people about a coffee chat", type: "daily", link: "https://www.linkedin.com/messaging/" }, // offered on the session's Open button, never opened on its own
  { key: "interview", label: "Interview practice", verb: "Practice", unit: "interview questions", type: "daily", link: null },
];
