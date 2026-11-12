import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PDF_PAGES } from "./constants";
import { PROFILE_COPY } from "./copy";
import { extractPdfText, lineText, type OpenPdf, type TextItem } from "./pdf";

const PDF_BYTES = new TextEncoder().encode("%PDF-1.7 pretend").buffer as ArrayBuffer;
const LONG_LINE = "Regression models in Stata and R, dashboards in SQL and Python, econometrics coursework at Chicago";

/** A stand-in for pdf.js: each page is a list of text runs. No file is parsed and no worker starts. */
function fakePdf(pages: TextItem[][]): OpenPdf & { read: number[] } {
  const read: number[] = [];
  const open = async () => ({
    numPages: pages.length,
    pageItems: async (page: number) => { read.push(page); return pages[page - 1]; },
  });
  return Object.assign(open, { read });
}

const failing = (name: string): OpenPdf => async () => {
  throw Object.assign(new Error("pdf.js said no"), { name });
};

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

describe("lineText: text runs back into lines", () => {
  it("joins runs as they are and breaks where the PDF ends a line", () => {
    expect(lineText([{ str: "Jessie", hasEOL: false }, { str: " ", hasEOL: false }, { str: "Chen", hasEOL: true }, { str: "Chicago", hasEOL: false }]))
      .toBe("Jessie Chen\nChicago");
  });
});

describe("extractPdfText", () => {
  it("returns the text of every page, cleaned", async () => {
    const open = fakePdf([
      [{ str: LONG_LINE, hasEOL: true }, { str: LONG_LINE, hasEOL: true }],
      [{ str: `${LONG_LINE}  `, hasEOL: false }],
    ]);
    expect(await extractPdfText(PDF_BYTES, open)).toEqual({ ok: true, value: `${LONG_LINE}\n${LONG_LINE}\n\n${LONG_LINE}` });
  });

  it("refuses bytes that are not a PDF before opening them", async () => {
    const open = fakePdf([[{ str: LONG_LINE, hasEOL: true }]]);
    const docx = new TextEncoder().encode("PK renamed.docx").buffer as ArrayBuffer;
    expect(await extractPdfText(docx, open)).toEqual({ ok: false, message: PROFILE_COPY.notPdf });
    expect(open.read).toEqual([]);
  });

  it("refuses a PDF with more pages than a resume has, without reading them", async () => {
    const open = fakePdf(Array.from({ length: MAX_PDF_PAGES + 1 }, () => [{ str: LONG_LINE, hasEOL: true }]));
    expect(await extractPdfText(PDF_BYTES, open)).toEqual({ ok: false, message: PROFILE_COPY.tooManyPages });
    expect(open.read).toEqual([]);
  });

  it("says an image-only or empty PDF has no text to read", async () => {
    expect(await extractPdfText(PDF_BYTES, fakePdf([[], []]))).toEqual({ ok: false, message: PROFILE_COPY.noTextInPdf });
    expect(await extractPdfText(PDF_BYTES, fakePdf([]))).toEqual({ ok: false, message: PROFILE_COPY.noTextInPdf });
  });

  it("says a PDF whose text is longer than a resume is too long", async () => {
    const page = Array.from({ length: 600 }, () => ({ str: LONG_LINE, hasEOL: true }));
    expect(await extractPdfText(PDF_BYTES, fakePdf([page]))).toEqual({ ok: false, message: PROFILE_COPY.tooLong });
  });

  it("asks for an unlocked copy when the PDF has a password", async () => {
    expect(await extractPdfText(PDF_BYTES, failing("PasswordException"))).toEqual({ ok: false, message: PROFILE_COPY.locked });
  });

  it("says the file could not be read when pdf.js fails, and logs why", async () => {
    expect(await extractPdfText(PDF_BYTES, failing("InvalidPDFException"))).toEqual({ ok: false, message: PROFILE_COPY.unreadable });
    expect(logged).toHaveBeenCalledOnce();
  });
});
