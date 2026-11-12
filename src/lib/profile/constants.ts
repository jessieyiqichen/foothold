/** Names and limits for a person's profile (their resume and its skill tags). The table's own checks in
 *  `supabase/migrations/*foothold_profiles.sql` repeat the limits; change both together. */
export const PROFILE_TABLE = "fh_profiles";
export const PROFILE_COLUMNS = "resume_text, resume_name, tags, tags_added, tags_removed, tags_version, updated_at";
export const PROFILE_PATH = "/profile";

export const PDF_MIME = "application/pdf";
export const PDF_EXTENSION = ".pdf";
/** Every PDF starts with this, within its first bytes; a renamed image or document does not. */
export const PDF_HEADER = "%PDF-";
export const PDF_HEADER_WINDOW = 1024;

/** A resume PDF is well under this; a bigger file is a scan or the wrong document. */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 20;

/** Fewer characters than this is not a resume: a PDF that yields so little is a scan with no text layer. */
export const MIN_RESUME_CHARS = 200;
export const MAX_RESUME_CHARS = 50_000;
export const MAX_RESUME_NAME_CHARS = 200;

/** The most tags a person may have added, and the most they may have removed. Above the vocabulary's size (164
 *  tags on 2026-11-11), so it only ever stops a row that is not from this page. */
export const MAX_TAG_EDITS = 200;

/** Tags from an older vocabulary whose row is gone are still shown, under this group. */
export const OTHER_GROUP = "other";
/** Group names as written in the vocabulary, where plain capitalising reads wrong. */
export const GROUP_LABELS: Record<string, string> = { ai: "AI", condition: "Degrees and eligibility", [OTHER_GROUP]: "Other" };
