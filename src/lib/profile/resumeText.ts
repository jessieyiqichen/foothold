import {
  MAX_PDF_BYTES, MAX_RESUME_CHARS, MAX_RESUME_NAME_CHARS, MIN_RESUME_CHARS, PDF_EXTENSION, PDF_HEADER, PDF_HEADER_WINDOW, PDF_MIME,
} from "./constants";
import { PROFILE_COPY } from "./copy";

/** The checks a resume passes before it is used: the file before it is opened, the text before it is tagged or saved.
 *  Each returns the line to show the person, or null when all is well. */

export function checkPdfFile(file: { name: string; type: string; size: number }): string | null {
  // Some browsers give no type for a file dragged from a mail client; then the name decides, and the header after it
  const isPdf = file.type === PDF_MIME || (file.type === "" && file.name.toLowerCase().endsWith(PDF_EXTENSION));
  if (!isPdf) return PROFILE_COPY.notPdf;
  if (file.size === 0) return PROFILE_COPY.emptyFile;
  if (file.size > MAX_PDF_BYTES) return PROFILE_COPY.tooBig;
  return null;
}

/** A name and a type can be anything; the file's first bytes cannot. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = String.fromCharCode(...bytes.subarray(0, PDF_HEADER_WINDOW));
  return head.includes(PDF_HEADER);
}

/** Everything below a space except a new line and a tab, plus delete. Postgres refuses a text holding \u0000. */
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export function cleanResumeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** `source` only changes the wording: a PDF that yields almost nothing is a scan, a short paste is unfinished. */
export function checkResumeText(text: string, source: "pdf" | "typed"): string | null {
  const length = cleanResumeText(text).length;
  if (length > MAX_RESUME_CHARS) return PROFILE_COPY.tooLong;
  if (length >= MIN_RESUME_CHARS) return null;
  if (source === "pdf") return PROFILE_COPY.noTextInPdf;
  return length === 0 ? PROFILE_COPY.emptyText : PROFILE_COPY.tooShort;
}

/** The file's own name, without any folder, at most as long as the column holds. */
export function displayName(name: string | null): string | null {
  const base = (name ?? "").split(/[\\/]/).pop()?.trim() ?? "";
  return base ? base.slice(0, MAX_RESUME_NAME_CHARS) : null;
}
