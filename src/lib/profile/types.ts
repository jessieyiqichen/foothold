/** What a step gives back: its value, or a line to show the person. Nothing here throws at the screen. */
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (message: string): Result<never> => ({ ok: false, message });

/** A person's saved profile: their resume as text and the skill tags found in it. */
export interface Profile {
  resumeText: string;
  /** The PDF's file name, or null when the text was pasted. */
  resumeName: string | null;
  /** The tags roles are matched on: found in the text, plus `tagsAdded`, minus `tagsRemoved`. */
  tags: string[];
  /** Vocabulary tags the person put on their profile themselves. */
  tagsAdded: string[];
  /** Vocabulary tags the person took off; kept so a tag stays off when the text yields it again. */
  tagsRemoved: string[];
  /** The vocabulary version the tags came from (`SKILLS_VERSION` when saved). */
  tagsVersion: number;
  updatedAt: string;
}
