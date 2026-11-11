import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES, MAX_RESUME_CHARS, MIN_RESUME_CHARS } from "./constants";
import { PROFILE_COPY } from "./copy";
import { checkPdfFile, checkResumeText, cleanResumeText, displayName, looksLikePdf } from "./resumeText";

const bytes = (text: string) => new TextEncoder().encode(text);
const pdf = { name: "resume.pdf", type: "application/pdf", size: 120_000 };

describe("checkPdfFile: is this file worth opening", () => {
  it("accepts a PDF of an ordinary size", () => {
    expect(checkPdfFile(pdf)).toBeNull();
  });

  it("accepts a PDF the browser gave no type for, by its name", () => {
    expect(checkPdfFile({ ...pdf, type: "", name: "Resume.PDF" })).toBeNull();
  });

  it("refuses another kind of file and says which kind to choose", () => {
    expect(checkPdfFile({ name: "resume.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 9000 })).toBe(PROFILE_COPY.notPdf);
    expect(checkPdfFile({ name: "photo.pdf", type: "image/png", size: 9000 })).toBe(PROFILE_COPY.notPdf);
  });

  it("refuses an empty file and one over the size limit", () => {
    expect(checkPdfFile({ ...pdf, size: 0 })).toBe(PROFILE_COPY.emptyFile);
    expect(checkPdfFile({ ...pdf, size: MAX_PDF_BYTES })).toBeNull();
    expect(checkPdfFile({ ...pdf, size: MAX_PDF_BYTES + 1 })).toBe(PROFILE_COPY.tooBig);
  });
});

describe("looksLikePdf: the file's first bytes, not its name", () => {
  it("is true for a PDF header, also after a few stray bytes", () => {
    expect(looksLikePdf(bytes("%PDF-1.7\n..."))).toBe(true);
    expect(looksLikePdf(bytes("\n\n  %PDF-1.4"))).toBe(true);
  });

  it("is false for anything else, and for an empty file", () => {
    expect(looksLikePdf(bytes("PK\u0003\u0004 a renamed docx"))).toBe(false);
    expect(looksLikePdf(new Uint8Array())).toBe(false);
  });
});

describe("cleanResumeText: what is kept from a PDF or a paste", () => {
  it("drops characters the database refuses and other control characters, keeping new lines and tabs", () => {
    expect(cleanResumeText("Py\u0000thon\u0007\tSQL\r\nStata\rR")).toBe("Python\tSQL\nStata\nR");
  });

  it("trims line ends, the text's ends, and runs of blank lines", () => {
    expect(cleanResumeText("\n\n  Education   \n\n\n\n\nChicago  \n")).toBe("Education\n\nChicago");
  });

  it("drops half of a broken emoji, which the database refuses, and keeps whole ones", () => {
    expect(cleanResumeText("Built \uD83D dashboards")).toBe("Built  dashboards");
    expect(cleanResumeText("Shipped\uDE80 it")).toBe("Shipped it");
    expect(cleanResumeText("Launched 🚀 twice")).toBe("Launched 🚀 twice");
  });

  it("does not change the text it is given", () => {
    const raw = "  a  ";
    cleanResumeText(raw);
    expect(raw).toBe("  a  ");
  });
});

describe("checkResumeText: is this enough, and not too much, to save", () => {
  // One word past the minimum: the last word's trailing space is trimmed before counting
  const enough = "word ".repeat(MIN_RESUME_CHARS / 5 + 1);

  it("accepts a resume-sized text", () => {
    expect(checkResumeText(enough, "pdf")).toBeNull();
    expect(checkResumeText(enough, "typed")).toBeNull();
  });

  it("says a PDF with no text is probably a scan, and what to do instead", () => {
    expect(checkResumeText("", "pdf")).toBe(PROFILE_COPY.noTextInPdf);
    expect(checkResumeText("Page 1", "pdf")).toBe(PROFILE_COPY.noTextInPdf);
  });

  it("asks for a resume when nothing was typed, and for more when it is too short", () => {
    expect(checkResumeText("   \n ", "typed")).toBe(PROFILE_COPY.emptyText);
    expect(checkResumeText("I like data", "typed")).toBe(PROFILE_COPY.tooShort);
  });

  it("refuses a text over the cap, counted after cleaning", () => {
    expect(checkResumeText("a".repeat(MAX_RESUME_CHARS), "typed")).toBeNull();
    expect(checkResumeText("a".repeat(MAX_RESUME_CHARS + 1), "typed")).toBe(PROFILE_COPY.tooLong);
    expect(checkResumeText("a".repeat(MAX_RESUME_CHARS) + "   \n\n", "pdf")).toBeNull();
  });
});

describe("displayName: the file name as it is stored", () => {
  it("keeps only the name, without a path, cut to the stored length", () => {
    expect(displayName("C:\\Users\\me\\resume.pdf")).toBe("resume.pdf");
    expect(displayName("/home/me/resume final.pdf")).toBe("resume final.pdf");
    expect(displayName("a".repeat(500))).toHaveLength(200);
  });

  it("never cuts an emoji in half: the cut counts whole characters", () => {
    const name = displayName("a".repeat(199) + "🚀.pdf");
    expect(name).toBe("a".repeat(199) + "🚀");
    expect(Array.from(name ?? "")).toHaveLength(200);
    expect(displayName("🚀".repeat(300))).toBe("🚀".repeat(200));
    expect(displayName("resume\uD83D.pdf")).toBe("resume.pdf");
  });

  it("is null when there is no name", () => {
    expect(displayName("  ")).toBeNull();
    expect(displayName(null)).toBeNull();
  });
});
