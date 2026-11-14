import { Barlow_Condensed, Martian_Mono, Schibsted_Grotesk } from "next/font/google";

// Tape & Tile's three faces (Builder's Board, taken on for Foothold 2026-11-13): a heavy grotesk for names and
// numbers, a mono for labels and meta, condensed capitals for section headings only.
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const martian = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], weight: ["400", "500"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["600", "700"] });

/** The class that makes the three font variables available to the whole app. */
export const fontClass = `${schibsted.variable} ${martian.variable} ${barlow.variable}`;
