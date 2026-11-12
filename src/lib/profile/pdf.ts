// Reads a resume PDF's text in the browser. The file never leaves the device: pdf.js parses it here, in a worker,
// and only the text the person then checks and saves is sent anywhere.
import { MAX_PDF_PAGES } from "./constants";
import { PROFILE_COPY } from "./copy";
import { checkResumeText, cleanResumeText, looksLikePdf } from "./resumeText";
import { fail, ok, type Result } from "./types";

/** One run of text on a page, as pdf.js reports it; `hasEOL` marks the end of a line. */
export interface TextItem {
  str: string;
  hasEOL: boolean;
}

/** The little of pdf.js this file needs, so the tests can stand in for it without parsing a file. */
export type OpenPdf = (data: ArrayBuffer) => Promise<{ numPages: number; pageItems: (page: number) => Promise<TextItem[]> }>;

/** pdf.js throws this, by name, for a PDF that needs a password. */
const PASSWORD_ERROR = "PasswordException";

export const lineText = (items: TextItem[]): string => items.map((item) => item.str + (item.hasEOL ? "\n" : "")).join("");

/** pdf.js itself, loaded only when a PDF is chosen (it is large) and only in the browser. */
const openWithPdfJs: OpenPdf = async (data) => {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data }).promise;
  return {
    numPages: doc.numPages,
    pageItems: async (page) => {
      const content = await (await doc.getPage(page)).getTextContent();
      // Marked-content entries carry no text; the runs that do have `str`
      return content.items.flatMap((item) => ("str" in item ? [{ str: item.str, hasEOL: item.hasEOL }] : []));
    },
  };
};

/** The text of a PDF, cleaned and checked, or the line to show when it cannot be used: not a PDF, locked, too many
 *  pages, no text layer (a scan), or longer than a resume. */
export async function extractPdfText(data: ArrayBuffer, open: OpenPdf = openWithPdfJs): Promise<Result<string>> {
  if (!looksLikePdf(new Uint8Array(data))) return fail(PROFILE_COPY.notPdf);
  try {
    const pdf = await open(data);
    if (pdf.numPages > MAX_PDF_PAGES) return fail(PROFILE_COPY.tooManyPages);
    const pages: string[] = [];
    for (let page = 1; page <= pdf.numPages; page++) pages.push(lineText(await pdf.pageItems(page)));
    const text = cleanResumeText(pages.join("\n\n"));
    const problem = checkResumeText(text, "pdf");
    return problem ? fail(problem) : ok(text);
  } catch (cause) {
    if (cause instanceof Error && cause.name === PASSWORD_ERROR) return fail(PROFILE_COPY.locked);
    console.error("Foothold: pdf.js could not read the chosen PDF", cause);
    return fail(PROFILE_COPY.unreadable);
  }
}
